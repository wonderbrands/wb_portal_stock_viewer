import { defineStore } from 'pinia'
import { StockGetterPort } from './stock_getter';
import { StringGetter } from './string_index';

export const useStore = defineStore('storeId', {
  state: () => {
    return {
       stock_getter: new StockGetterPort(
           {
               pages_per_sheet: 90
           }
       ),
       string_index: new StringGetter(),
    }
  },
})