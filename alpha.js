/* This file exports all of the API objects and connections for the application */ 

export const base_url = 'https://www.alphavantage.co/query';
export const sma = {
    function: '?function=SMA',
    symbol: '&symbol=',
    interval: '&interval=',
    time_period: '&time_period=100',
    series_type: '&series_type=close',
    apikey: '&apikey='
};
export const investment_types = [
    {
        type: 'stock',
        name: 'Stock',
        url: 'https://www.alphavantage.co/query?',
        function: {
            title: 'Time Series',
            name: 'TIME_SERIES',
            base: 'function=TIME_SERIES_',
            functions: [
                {
                    title: 'Intraday',
                    name: 'INTRADAY',
                },
                {
                    title: 'Daily Adjusted',
                    name: 'DAILY_ADJUSTED',
                },
                {
                    title: 'Weekly',
                    name: 'WEEKLY',
                },
                {
                    title: 'Weekly Adjusted',
                    name: 'WEEKLY_ADJUSTED',
                },
                {
                    title: 'Monthly',
                    name: 'MONTHLY',
                },
                {
                    title: 'Monthly Adjusted',
                    name: 'MONTHLY_ADJUSTED',
                }
            ]
        },
        symbol: '&symbol=',
        interval: '&interval=',
        outputsize: '&outputsize=full',
        apikey: '&apikey=',
        selected: 'selected'
    },
    {
        type: 'currency',
        name: 'Currency Exchange', 
        csv: 'https://www.alphavantage.co/physical_currency_list/',
        selected: ''
    },
    {
        type: 'crypto',
        name: 'Digital & Crypto Currencies', 
        csv: 'https://www.alphavantage.co/digital_currency_list/',
        selected: ''
    },
    {
        type: 'commodities',
        name: 'Commodities', 
        list: [
            {
                name: 'Crude Oil (WTI)',
                url: 'https://www.alphavantage.co/query?function=WTI',
                interval: 'daily,weekly,monthly'
            },
            {
                name: 'Crude Oil (Brent)',
                url: 'https://www.alphavantage.co/query?function=BRENT',
                interval: 'daily,weekly,monthly'
            },
            {
                name: 'Natural Gas',
                url: 'https://www.alphavantage.co/query?function=NATURAL_GAS',
                interval: 'daily,weekly,monthly'
            },
            {
                name: 'Copper',
                url: 'https://www.alphavantage.co/query?function=COPPER',
                interval: 'daily,weekly,monthly'
            },
            {
                name: 'Aluminum',
                url: 'https://www.alphavantage.co/query?function=ALUMINUM',
                interval: 'daily,weekly,monthly'
            },
            {
                name: 'Wheat',
                url: 'https://www.alphavantage.co/query?function=WHEAT',
                interval: 'daily,weekly,monthly'
            },
            {
                name: 'Corn',
                url: 'https://www.alphavantage.co/query?function=CORN',
                interval: 'daily,weekly,monthly'
            },
            {
                name: 'Cotton',
                url: 'https://www.alphavantage.co/query?function=COTTON',
                interval: 'daily,weekly,monthly'
            },
            {
                name: 'Sugar',
                url: 'https://www.alphavantage.co/query?function=SUGAR',
                interval: 'daily,weekly,monthly'
            },
            {
                name: 'Coffee',
                url: 'https://www.alphavantage.co/query?function=COFFEE',
                interval: 'daily,weekly,monthly'
            },
            {
                name: 'GCI',
                url: 'https://www.alphavantage.co/query?function=ALL_COMMODITIES',
                interval: 'daily,weekly,monthly'
            }
        ],
        selected: ''
    }
]
export const endpoints = {
    search: {
        function: 'SYMBOL_SEARCH',
        keywords: ''
    },
    series:
    {
        function: 'TIME_SERIES_INTRADAY',
        symbol: '',
        interval: ''
    },
    market_status:
    {
        function: 'MARKET_STATUS'
    },
    listing_status: 
    {
        function: 'LISTING_STATUS'
    },
};