enum AvailabilityIndicator {
    IN_STOCK = "In Stock",
    LOW_STOCK = "Low Stock",
    OUT_OF_STOCK = "Out of Stock"
}

class Product {
    odoo_id: number;
    sku: string;
    name: string;
    price: number;
    img_url: string;
    in_ag_stock: number;
    availability_indictator: AvailabilityIndicator;

    constructor(odoo_id: number, sku: string, name: string, price: number, img_url: string, in_ag_stock: number) {
        this.odoo_id = odoo_id;
        this.sku = sku;
        this.name = name;
        this.price = price;
        this.img_url = img_url;
        this.in_ag_stock = in_ag_stock;
        if(in_ag_stock === 0) {
            this.availability_indictator = AvailabilityIndicator.OUT_OF_STOCK;
        } else if(in_ag_stock < 5) {
            this.availability_indictator = AvailabilityIndicator.LOW_STOCK;
        } else {
            this.availability_indictator = AvailabilityIndicator.IN_STOCK;
        }
    }
}

class StockList {
    product_list: Product[] = [];
    curr_page: number;
    pages_per_sheet: number;
    instanceTableController: StockTableController

    constructor(curr_page: number, pages_per_sheet: number, instanceTableController: StockTableController) {
        this.curr_page = curr_page;
        this.pages_per_sheet = pages_per_sheet;
        this.instanceTableController = instanceTableController;
    }

    async init() {}
}

class StockListDev extends StockList {
    constructor (curr_page: number, pages_per_sheet: number, instanceTableController: StockTableController) {
        super(curr_page, pages_per_sheet, instanceTableController);
    }

    async init(){
        await this.getPaginatedProducts(
            null, 
            null, 
            this.curr_page, 
            this.pages_per_sheet,
            this.instanceTableController);
    }


    async getPaginatedProducts(filter: any, order_by: any, curr_page: number, pages_per_sheet: number, instanceTableController: StockTableController) {
        this.product_list = [];
        const wait_time = Math.random() * 2.5 + 0.5;
        await new Promise(resolve => setTimeout(resolve, wait_time * 1000));
        for (let i = 0; i < pages_per_sheet; i++) {
            this.product_list.push(new Product(
                Math.floor(Math.random() * 10000),
                `sku${Math.floor(Math.random() * 10000)}`,
                `name${Math.floor(Math.random() * 10000)}`,
                Math.floor(Math.random() * 100),
                "https://www.pngfind.com/pngs/m/131-1312918_png-file-svg-product-icon-transparent-png.png",
                Math.floor(Math.random() * 10000)
            ));
        }
    }
}

class StockListProd extends StockList {
    constructor (curr_page: number, pages_per_sheet: number, instanceTableController: StockTableController) {
        super(curr_page, pages_per_sheet, instanceTableController);
    }

    async init(){
        await this.getPaginatedProducts(
            null, 
            null, 
            this.curr_page, 
            this.pages_per_sheet, 
            this.instanceTableController);
    }

    async getPaginatedProducts(filter: any, order_by: any, curr_page: number, pages_per_sheet: number, instanceTableController: StockTableController) {
        this.product_list = [];
        try {
            const response = await fetch("/controller/get_products", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filter: filter,
                    order_by: order_by,
                    curr_page: curr_page,
                    pages_per_sheet: pages_per_sheet
                })
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log(data);
            this.setTotalPages(data.result.total_products, instanceTableController);  
            
            for (let i = 0; i < data.result.products.length; i++) {
                this.product_list.push(new Product(
                    data.result.products[i].odoo_id,
                    data.result.products[i].sku,
                    data.result.products[i].name,
                    data.result.products[i].price,
                    data.result.products[i].img_url,
                    data.result.products[i].in_ag_stock
                ));
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    setTotalPages(total_products: number, instanceTableController: StockTableController) {
        console.log("total products: " + total_products);
        console.log(instanceTableController)
        instanceTableController.total_products = total_products;
    }

}

class StockTableController {
    pages_per_sheet: number;
    current_page: number;
    total_products: number;
    available_pages: number;

    constructor(pages_per_sheet) {
        this.current_page = 1;
        this.pages_per_sheet = pages_per_sheet;
    }

    async init() {}
}

class StockTableControllerDev extends StockTableController {
    constructor(pages_per_sheet) {
        super(pages_per_sheet);
    }

    async init() {
        await this.getStockData();
    }

    async getStockData() {
        const wait_time = Math.random() * 2.5 + 0.5;
        await new Promise(resolve => setTimeout(resolve, wait_time * 1000));
        this.total_products = 2000;
    }
}

class StockTableControllerProd extends StockTableController {
    constructor(pages_per_sheet) {
        super(pages_per_sheet);
    }

    async init() {
        await this.getStockData();
    }

    async getStockData() {
        try {
            const response = await fetch("/controller/get_total_products", {
                method: 'GET',
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log("pages")
            console.log(data);
            this.total_products = data;
            console.log("total products: " + this.total_products);
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

export class StockGetterPort{

    pages_per_sheet: number;
    StockTableController: StockTableController
    StockList: StockList;


    constructor(initial_conditions: any) {
        this.pages_per_sheet = initial_conditions.pages_per_sheet;
    }

    async init() {
        switch(import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT) {
            case "dev":
                this.StockTableController = new StockTableControllerDev(this.pages_per_sheet);
                this.StockList = new StockListDev(0, this.pages_per_sheet, this.StockTableController);
                await this.StockTableController.init();
                await this.StockList.init();
                break;
            case "prod":
                this.StockTableController = new StockTableControllerProd(this.pages_per_sheet);
                this.StockList = new StockListProd(0, this.pages_per_sheet, this.StockTableController);
                await this.StockTableController.init();
                await this.StockList.init();
                break;
        }
    }

    async onChangeTab(filters, sort, page) {
        console.log("stock table controller")
        console.log(this.StockTableController)
        this.StockList.curr_page = page;
        await this.StockList.getPaginatedProducts(
            filters,
            sort,
            this.StockList.curr_page, 
            this.pages_per_sheet,
            this.StockTableController
        )
        window.scrollTo({
            top: 0,
            behavior: 'smooth' 
          });
                
    }
}
