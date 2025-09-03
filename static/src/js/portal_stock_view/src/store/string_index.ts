export class StringGetter{
    constructor(){
        switch(import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT) {
            case "dev":
                this.string = {
                    col_sku: "SKU",
                    col_name: "Nombre",
                    col_img: "Imagen",
                    col_in_stock: "Cantidad",
                    col_availability: "Disponibilidad",
                    availability_indictator_in_stock: "Disponible",
                    availability_indictator_low_stock: "Bajas existencias",
                    availability_indictator_out_of_stock: "Agotado"
                }
                break;
            case "prod":
                this.string = {
                    col_sku: "SKU",
                    col_name: "Nombre",
                    col_img: "Imagen",
                    col_in_stock: "Cantidad",
                    col_availability: "Disponibilidad",
                    availability_indictator_in_stock: "Disponible",
                    availability_indictator_low_stock: "Bajas existencias",
                    availability_indictator_out_of_stock: "Agotado"
                }
                break;
        }
    }
}