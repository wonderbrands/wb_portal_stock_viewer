# -*- coding: utf-8 -*-
{
    'name': "wb_portal_stock_viewer",

    'summary': """
        """,

    'description': """
        
    """,

    'author': "My Company",
    'website': "http://www.yourcompany.com",

    'category': 'Uncategorized',
    'version': '15.0',

    'depends': [
        'base',
        'stock',       
        'web',
        'portal',
        'website',
    ],

    'data': [
        'views/portal_view.xml',
    ],

      'assets': {
        'web.assets_frontend': [
            'wb_portal_stock_viewer/static/src/css/styles.css',
            'wb_portal_stock_viewer/static/src/js/portal_stock.js',
        ],
    },
}
