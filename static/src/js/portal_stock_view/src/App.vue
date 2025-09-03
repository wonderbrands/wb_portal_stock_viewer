<template>
  
  <div v-if="loading" class="modal-overlay">
    <div class="modal-box">
      <div>Loading...</div>
      <div class="spinner"></div>
    </div>
  </div>

  <DataTable
    :value="products"
    stripedRows
    paginator
    :rows="90"
    :lazy="true"
    :first="page_0"
    :totalRecords="store.stock_getter.StockTableController.total_products"
    :filters="filters"
    removableSort
    @sort="onSort"
    @page="onPageChange"
    v-if="initial_loaded"
  >
    <Column
      v-for="col_name in col_name_keys"
      :key="col_name"
      :field="map_col_name(col_name)"
      :sortable="col_name !== 'col_img' && col_name !== 'col_availability'"
      :filter="col_name !== 'col_img'"
      :filterField="map_col_name(col_name)"
      :filterMatchMode="'contains'"
    >
      <!-- Custom header with input -->
      <template #header>
        <div class="column-header">
          <span>{{ store.string_index.string[col_name] }}</span>
          <InputText
            v-if="col_name !== 'col_img' && col_name !== 'col_availability'"
            v-model="filters[map_col_name(col_name)].value"
            @input="e => onFilterWrapper(e, col_name)"
            placeholder="Search"
            class="mt-1"
          />
          <Select v-else-if="col_name === 'col_availability'" 
            v-model="filters[map_col_name(col_name)].value"
            :options="availability_indictators.map(availability_indictator => store.string_index.string[availability_indictator])"
            @change="e => onFilterWrapper(e, col_name)">
            <template #option="slotProps">
              <Tag v-if="slotProps.option === 'Agotado'" severity="danger" :value="slotProps.option"></Tag>
              <Tag v-else-if="slotProps.option === 'Disponible'" severity="success" :value="slotProps.option"></Tag>
              <Tag v-else-if="slotProps.option === 'Bajas existencias'" severity="warning" :value="slotProps.option"></Tag>
            </template>
            <template #value="slotProps">
              <div v-if="!slotProps.value">
                Disponible
              </div>
          </template>

          </Select>

            <!--:options="availability_indictators.map(availability_indictator => store.string_index.string[availability_indictator])" 
            :optionLabel="availability_indictators.map(availability_indictator => store.string_index.string[availability_indictator])"-->
            
         

        </div>
      </template>

      <!-- Image column -->
      <template v-if="col_name === 'col_img'" #body="slotProps">
        <img class="product-image" :src="slotProps.data.img_url" />
      </template>
      <template v-else-if="col_name === 'col_availability'" #body="slotProps">
        <Tag v-if="slotProps.data.availability_indictator === 'Out of Stock'" severity="danger" value="Agotado"></Tag>
        <Tag v-else-if="slotProps.data.availability_indictator === 'In Stock'" severity="success" value="Disponible"></Tag>
        <Tag v-else-if="slotProps.data.availability_indictator === 'Low Stock'" severity="warning" value="Bajas existencias"></Tag>
      </template>
    </Column>
  </DataTable>
</template>

<script>
import { useStore } from './store'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag';

// debounce util (can be extracted later)
function debounce(fn, delay) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

export default {
  data() {
    return {
      initial_loaded: false,
      loading: true,
      products: [],
      page_0: 0,
      cur_page: 0,
      sort_field: null,
      filters: {
        sku: { value: null, matchMode: 'contains' },
        name: { value: null, matchMode: 'contains' },
        price: { value: null, matchMode: 'contains' },
        img_url: { value: null, matchMode: 'contains' },
        in_ag_stock: { value: null, matchMode: 'contains' },
        availability_indictator: { value: null, matchMode: 'contains' }
      },
      debouncedFilter: null
    }
  },
  async mounted() {
    this.store = useStore()
    await this.store.stock_getter.init()

    this.col_name_keys = Object.keys(this.store.string_index.string).filter(key =>
      key.startsWith('col_')
    )

    this.availability_indictators = Object.keys(this.store.string_index.string).filter(key =>
      key.startsWith('availability_indictator_')
    )

    console.log(this.availability_indictators.map(availability_indictator => this.store.string_index.string[availability_indictator]))


    this.setProducts(this.store.stock_getter.StockList.product_list)

    // set up the debounced function
    this.debouncedFilter = debounce(async () => {
      this.page_0 = 0
      this.loading = true
      await this.onFilter(this.filters)
      this.loading = false
    }, 700)

    this.initial_loaded = true
    this.loading = false
  },
  methods: {
    map_col_name(col_name) {
      const map = {
        col_sku: 'sku',
        col_name: 'name',
        col_img: 'img_url',
        col_in_stock: 'in_ag_stock',
        col_availability: 'availability_indictator'
      }
      return map[col_name]
    },
    setProducts(products_list) {
      this.products = products_list.map(product => ({
        sku: product.sku,
        name: product.name,
        img_url: product.img_url,
        in_ag_stock: product.in_ag_stock,
        availability_indictator: product.availability_indictator
      }))
    },
    async onSort(event) {
      this.loading = true
      console.log('Sorting with:', event)
      this.sort_field = {
        field: event.sortField,
        order: event.sortOrder
      }
      await this.store.stock_getter.onChangeTab(this.filters, this.sort_field, 0)
      this.page_0 = 0
      this.setProducts(this.store.stock_getter.StockList.product_list)
      this.loading = false
    },
    async onPageChange(event) {
      this.loading = true
      console.log('Paging with:', event)
      this.cur_page = event.page
      await this.store.stock_getter.onChangeTab(this.filters, this.sort_field, this.cur_page)
      this.setProducts(this.store.stock_getter.StockList.product_list)
      this.loading = false
    },
    async onFilter(filters) {
      console.log('Filtering with all filters:', filters)
      this.filters = filters
      await this.store.stock_getter.onChangeTab(this.filters, this.sort_field, this.cur_page)
      this.setProducts(this.store.stock_getter.StockList.product_list)
    },
    onFilterWrapper(e, col_name) {
      const field = this.map_col_name(col_name)
      const value = col_name === 'col_availability' ? e.value : e.target.value

      if (field === 'availability_indictator') {
        this.filters["in_ag_stock"].value = null
      }

      if (field === 'in_ag_stock') {
        if (this.filters["in_ag_stock"].value == 0) {
          this.filters["availability_indictator"].value = "Agotado"
        } else if (this.filters["in_ag_stock"].value  < 5) {
          this.filters["availability_indictator"].value = "Bajas existencias"          
        } else {
          this.filters["availability_indictator"].value = "Disponible"
        }
         
      }
      // Update local filter state
      if (this.filters[field]) {
        this.filters[field].value = value
      } else {
        this.filters[field] = { value, matchMode: 'contains' }
      }

      // Debounced backend call with full filter set
      this.debouncedFilter()
    }
  },
  components: {
    DataTable,
    Column,
    ProgressSpinner,
    InputText,
    Select,
    Tag
  }
}
</script>


<style >
</style>
