from odoo import http
from odoo.http import request
import logging
import json

_logger = logging.getLogger(__name__)

class StockViewer(http.Controller):
    @http.route('/controller/get_products', type='json', auth='user', website=True)
    def stock_viewer(self, **kwargs):
        _logger.info('-------------------------------------')
        _logger.info('stock_viewer')
        _logger.info(kwargs)
        body = request.httprequest.get_data().decode()
        _logger.info(body)
        dict_body = json.loads(body)
        _logger.info(dict_body)
        _logger.info('-------------------------------------')
        product_product_obj = request.env['product.product']
        stock_quant = request.env['stock.quant']

        if not dict_body['filter'] and not dict_body['order_by'] and dict_body['curr_page'] == 0:
            _logger.info('ENTRA A CONDICION INICIAL')
            # 1. Find all stock records in 'AG/Stock' with a quantity greater than 0.
            quants = stock_quant.search([
                ('location_id.complete_name', '=', 'AG/Stock'),
                ('available_quantity', '>=', 5)
            ])

            stock_quantity_map = {}
            for quant in quants:
                stock_quantity_map[quant.product_id.id] = quant.available_quantity


            # 2. Get the unique IDs of the products from those stock records.
            product_ids_with_stock = quants.filtered(lambda q: q.available_quantity >= 5).mapped('product_id').ids

            # 3. Use this list of IDs in your final domain.
            domain = [
                ('sale_ok', '=', True),
                ('id', 'in', product_ids_with_stock),
            ]
           

            stock_picking_obj = product_product_obj.search(
                domain, 
                limit=dict_body['curr_page']
            )
            data = []
            for i in stock_picking_obj:
                data.append({
                    'odoo_id': i.id,
                    'sku': i.default_code,
                    'name': i.name,
                    'img_url': '/web/image?model=product.product&id=%s&field=image_1024' % i.id,
                    'in_ag_stock': stock_quantity_map.get(i.id, 0)
                })
            return {
                'products': data,
                'domain': domain,
                'total_products': len(stock_picking_obj),
            }
        else:
            _logger.info('ENTRA A CONDICION ELSE')
            if not dict_body["filter"]['availability_indictator']["value"] and not dict_body["filter"]['in_ag_stock']["value"]:
                dict_body["filter"]['availability_indictator']["value"] = "Disponible"
            #handle filters
            #availability
            # 1. Start with a domain for STORABLE fields only.
            stock_quant_domain = [('location_id.complete_name', '=', 'AG/Stock')]

            # 2. Search the database with this safe, storable domain.
            quants_in_location = stock_quant.search(stock_quant_domain)

            # 3. Apply your non-stored field logic in Python using .filtered().
            final_quants = None
            specific_qty_value = dict_body["filter"]["in_ag_stock"]["value"]

            if specific_qty_value:
                try:
                    # ✨ FIX: Convert the input string to a float for correct comparison
                    specific_qty = float(specific_qty_value)
                    final_quants = quants_in_location.filtered(lambda q: q.available_quantity == specific_qty)
                except (ValueError, TypeError):
                    # If the input isn't a valid number, return an empty set to prevent errors
                    final_quants = quants_in_location.browse()
            else:
                # This part for the availability indicator already works because it compares numbers to numbers
                availability = dict_body["filter"]['availability_indictator']["value"]
                if availability == "Disponible":
                    final_quants = quants_in_location.filtered(lambda q: q.available_quantity >= 5)
                elif availability == "Bajas existencias":
                    final_quants = quants_in_location.filtered(lambda q: 0 < q.available_quantity < 5)
                elif availability == "Agotado":
                    final_quants = quants_in_location.filtered(lambda q: q.available_quantity == 0)
                else:
                    final_quants = quants_in_location

            # The rest of your code for building the map will now work correctly...
            stock_quantity_map = {}
            for quant in final_quants:
                current_qty = stock_quantity_map.setdefault(quant.product_id.id, 0)
                stock_quantity_map[quant.product_id.id] = current_qty + quant.available_quantity

            product_ids_with_stock = list(stock_quantity_map.keys())

           

            product_domain = [
                ('sale_ok', '=', True),
                ('id', 'in', product_ids_with_stock),
            ]
            
            # Name and SKU filters
            if dict_body["filter"]["name"]["value"]:
                product_domain.append(('name', 'ilike', dict_body["filter"]["name"]["value"]))
            if dict_body["filter"]["sku"]["value"]:
                product_domain.append(('default_code', 'ilike', dict_body["filter"]["sku"]["value"]))

            # --- PAGINATION & SORTING LOGIC ---
            
            # Calculate pagination offset
            pages_per_sheet = dict_body["pages_per_sheet"]
            offset = 0
            if dict_body["curr_page"] >= 1:
                offset = dict_body["curr_page"] * pages_per_sheet

            records_to_process = None

            # Get the total count of products matching the filters
            count_all_filts = product_product_obj.search_count(product_domain)

            if dict_body.get("order_by") and dict_body["order_by"]["field"] == "in_ag_stock":
                # --- PATH 1: SORT IN PYTHON for 'in_ag_stock' ---
                asc_or_desc = "ASC" if dict_body["order_by"]["order"] == 1 else "DESC"

                # 1. Search ALL products matching the domain (no limit/offset/order)
                all_products = product_product_obj.search(product_domain)

                # 2. Combine products with their quantities from your map
                products_with_qty = [{'product': p, 'qty': stock_quantity_map.get(p.id, 0)} for p in all_products]

                # 3. Sort the list in Python
                sorted_list = sorted(
                    products_with_qty,
                    key=lambda item: item['qty'],
                    reverse=(asc_or_desc == 'DESC')
                )
                
                # 4. Apply pagination to the Python-sorted list
                paginated_list = sorted_list[offset : offset + pages_per_sheet]
                
                # 5. Extract just the product records to be used in the final loop
                records_to_process = [item['product'] for item in paginated_list]
            else:
                # --- PATH 2: SORT IN DATABASE for standard fields ---
                order_string = None
                if dict_body.get("order_by"):
                    asc_or_desc = "ASC" if dict_body["order_by"]["order"] == 1 else "DESC"
                    field = dict_body["order_by"]["field"]
                    if field == "name":
                        order_string = f"name {asc_or_desc}"
                    elif field == "sku":
                        order_string = f"default_code {asc_or_desc}"
                
                # Search and sort in the database, applying pagination
                records_to_process = product_product_obj.search(
                    product_domain, 
                    order=order_string,
                    limit=pages_per_sheet,
                    offset=offset
                )

            # --- FINAL DATA PREPARATION ---
            data = []
            for i in records_to_process:
                data.append({
                    'odoo_id': i.id,
                    'sku': i.default_code,
                    'name': i.name,
                    'img_url': f'/web/image?model=product.product&id={i.id}&field=image_1024',
                    'in_ag_stock': stock_quantity_map.get(i.id, 0)
                })
            
            return {
                'products': data,
                'total_products': count_all_filts,
            }

    @http.route('/controller/get_total_products', type='http', auth='user', website=True)
    def prod_viewer(self, **kwargs):
        product_product_obj = request.env['product.product']
        domain = [('sale_ok', '=', True)]
        stock_picking_obj = product_product_obj.search(domain)
        _logger.info('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')
        _logger.info('-------------------------------------')
        _logger.info('prod_viewer')
        _logger.info(kwargs)
        body = request.httprequest.get_data().decode()
        _logger.info(body)
        _logger.info(stock_picking_obj)
        _logger.info('-------------------------------------') 
        return str(len(stock_picking_obj))
