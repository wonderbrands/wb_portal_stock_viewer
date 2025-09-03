import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import PrimeVue from 'primevue/config';
import Lara from '@primeuix/themes/lara';
import { definePreset } from '@primeuix/themes';





const app = createApp(App);
const pinia = createPinia()


app.use(PrimeVue, {
    theme: {
        preset: definePreset(Lara, {
            semantic: {
                primary: {
                    50: '{yellow.50}',
                    100: '{yellow.100}',
                    200: '{yellow.200}',
                    300: '{yellow.300}',
                    400: '{yellow.400}',
                    500: '{yellow.500}',
                    600: '{yellow.600}',
                    700: '{yellow.700}',
                    800: '{yellow.800}',
                    900: '{yellow.900}',
                    950: '{yellow.950}'
                }
            },
        }), 
        options: {
            darkModeSelector: false
        }
    },
 });

app.use(pinia)
app.mount('#portal_stock_show');

