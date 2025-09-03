# my_module/controllers/portal.py
# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from odoo.addons.portal.controllers.portal import CustomerPortal

class MyCustomerPortal(CustomerPortal):

    @http.route(['/stock'], type='http', auth="user", website=True)
    def my_custom_portal_page(self, **kw):
        return request.render("wb_portal_stock_viewer.portal_stock_show", {})