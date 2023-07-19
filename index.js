
/* 
    This is the main js file. The Vue created app code resides in this file. 
    All components and modules are imported into this file.
*/

// Import the Alpha Advantage API key
import { api_key } from './keys.js';
// Import the Alpha API base url, endpoints and modifiers.
import { base_url, endpoints, investment_types, sma } from './alpha.js';
// Import Vue functions and objects
import { createApp, ref, toRaw } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
// Import the custom Vue Table Component
import { HistoryTable } from './table.js';
// Import the Machine Learning functions used with TensorFlow.js
import { trainModel, makePredictions } from './model.js';
// Import the custom Vue Plotly Graphing Component
import { VuePlot } from './vue_plot.js';

// Create the Vue app
const app = createApp({
    data() {
        return {
            api_key: api_key,
            base_url: base_url,
            sma: {
                api: sma,
                raw: {},
                data: []
            },
            trainer: {
                disable: 'disabled',
                raw: [],
                data: {
                    y: [],
                    x: []
                }
            },
            price_var: 'adjusted',
            stocks: [],
            exchanges: [],
            investment_types: investment_types,
            currency_list: [],
            digital_currency: [],
            endpoints: endpoints,
            search_field: 'symbol',
            selected_exchange: 'NYSE',
            selected_type: 'stock',
            selected_series: 'INTRADAY',
            showStocks: false,
            interval: ['1min', '5min', '15min', '30min'],
            selected_interval: '5min',
            meta: {},
            load_graph: false,
            load_history: false,
            load_sma: false,
            train_data: false,
            train_graph: false,
            load_validate: false,
            load_predict: false,
            tf_data: [], 
            epoch: 0,
            plot_graph: {
                data:[{
                    x: [1,2,3,4],
                    y: [10,15,13,17],
                    type:"scatter"
                }],
                layout:{
                    title: "My graph"
                }
            },
            date_range: {
                start: new Date(),
                end: new Date()
            },
            selected_stock: {
                name: '',
                symbol: '',
                raw: '',
                chart: {
                    data: [],
                    layout: {},
                    config: {}
                },
                history: []
            },
            input_dataset: [],
            result: [],
            data_raw: [],
            sma_vec: [],
            window_size: 50,
            trainingsize: 70,
            n_epochs: 5,
            learningrate: 0.01,
            n_hiddenlayers: 4,
            predict_disable: 'disabled',
            data_temporal_resolutions: 'Weekly',
            // this is a custom debugging component that I have used for many years.
            debug_title_1: 'Debugger 1',
            debug_data_1: '',
            debug_title_2: 'Debugger 2',
            debug_data_2: '',
            debug_title_3: 'Debugger 3',
            debug_data_3: ''
        }
    },
    // Register all Vue Components
    components: {
        history_table: HistoryTable,
        VuePlot: VuePlot
    },
    updated() {
        // This is an event hook that allows the developer to access the application members on data binding update
    },
    mounted() {
        // Event Hook for when the app template is mounted to the DOM
        [...document.querySelectorAll('[data-bs-toggle="tooltip"]')].forEach(el => new bootstrap.Tooltip(el));
        [...document.querySelectorAll('[data-bs-toggle="popover"]')].forEach(el => new bootstrap.Popover(el));
        this.getListings();
    },
    methods: {
        //This function is used to create the Simple Moving Average (SMA) data set taken from the Selected Stock history.  
        computeSMA(data, window_size) {
            let me = this;
            let r_avgs = [], avg_prev = 0;
            for (let i = 0; i <= data.length - window_size; i++){
                let curr_avg = 0.00, t = i + window_size;
                for (let k = i; k < t && k <= data.length; k++){
                    curr_avg += data[k][me.price_var] / window_size;
                }
                r_avgs.push({ set: data.slice(i, i + window_size), avg: curr_avg });
                avg_prev = curr_avg;
            }
            return r_avgs;
        },
        // Format Date
        formatDate(date) {
            var d = new Date(date),
                month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear();

            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;

            return [year, month, day].join('-');
        },
        // Dubugger Code
        loadDebugger(cont, title, data) {
            switch (cont) {
                case 1:
                    this.debug_title_1 = title;
                    this.debug_data_1 = data;
                    break;
                case 2:
                    this.debug_title_2 = title;
                    this.debug_data_2 = data;
                    break;
                default:
                    this.debug_title_3 = title;
                    this.debug_data_3 = data;
                    break;
            }
            
        },
        // Pulls a csv file that gives a list of all of the hard currencies available from Alpha
        getCurrencyListings() {
            let me = this;
            let endpoint = me.investment_types[1].csv;
            let url = endpoint;
            axios.get(url)
                .then(function (response) {
                    let data = response.data;
                    let objs = data.split('\r\n');
                    let headers = objs.shift().split(',');
                    let rows = [];
                    objs.forEach(function (sym) { 
                        let vals = sym.split(',');
                        let item = {};
                        item.show = 'hide';
                        headers.forEach(function (head, index) { 
                            item[head.replace(' ', '_')] = vals[index];
                        });
                        rows.push(item);
                    });
                    me.currency_list = rows;
                    me.loadDebugger(1, 'Currency: ', data);
                    me.loadDebugger(2, 'Headers: ', headers);
                    me.loadDebugger(3, 'Rows: ', JSON.stringify(rows));
                })
                .catch(function (error) {
                    me.loadDebugger(3, 'Get Stock Data Error: ', JSON.stringify(error));
                });
        },
        // Pulls a csv file that gives a list of all of the digital currencies available from Alpha
        getDigitalListings() {
            let me = this;
            let endpoint = me.investment_types[2].csv;
            let url = endpoint;
            axios.get(url)
                .then(function (response) {
                    let data = response.data;
                    let objs = data.split('\r\n');
                    let headers = objs.shift().split(',');
                    let rows = [];
                    objs.forEach(function (sym) { 
                        let vals = sym.split(',');
                        let item = {};
                        item.show = 'hide';
                        headers.forEach(function (head, index) { 
                            item[head.replace(' ', '_')] = vals[index];
                        });
                        rows.push(item);
                    });
                    me.digital_currency = rows;
                    me.loadDebugger(1, 'Digital Crypto: ', data);
                    me.loadDebugger(2, 'Headers: ', headers);
                    me.loadDebugger(3, 'Rows: ', JSON.stringify(rows));
                })
                .catch(function (error) {
                    me.loadDebugger(3, 'Get Stock Data Error: ', JSON.stringify(error));
                });
        },
        // Pulls a csv file that gives a list of all of the stocks available from Alpha
        getListings() {
            let me = this;
            let endpoint = me.endpoints.listing_status;
            let url = me.base_url + '?function=' + endpoint.function + '&apikey=' + me.api_key;
            //me.loadDebugger(2, 'Get Listings after get: ', url);
            axios.get(url)
                .then(function (response) {
                    let data = response.data;
                    let objs = data.split('\r\n');
                    let headers = objs.shift().split(',');
                    let rows = [];
                    objs.forEach(function (sym) { 
                        let vals = sym.split(',');
                        let item = {};
                        item.show = 'hide';
                        headers.forEach(function (head, index) { 
                            item[head] = vals[index];
                        });
                        rows.push(item);
                    });
                    me.stocks = rows;
                    me.exchanges = [...new Set(me.stocks.map((item) => item.exchange))];
                    ///me.loadDebugger(1, 'Exchanges: ', me.exchanges);
                   // me.loadDebugger(2, 'Headers: ', headers);
                   // me.loadDebugger(3, 'Rows: ', JSON.stringify(rows));
                })
                .catch(function (error) {
                    me.loadDebugger(3, 'Get Stock Data Error: ', JSON.stringify(error));
                });
        },
        // This function filters the Stock list by Symbol or by Title 
        findStock() {
            event.preventDefault();
            let me = this;
            let txt = document.getElementById('search-txt').value.toLowerCase();
            let ex = this.selected_exchange;
            let search = this.search_field;
            if (search == 'symbol'){
                this.stocks.forEach(function (stock) { 
                    let symbol = stock.symbol.toLowerCase();
                    if (symbol.indexOf(txt) > -1 && me.selected_exchange == stock.exchange) {
                        stock.show = '';
                    }
                    else {
                        stock.show = 'hide';
                    }
                });
            }
            else {
                this.stocks.forEach(function (stock) { 
                    let name = stock.name.toLowerCase();
                    if (name.indexOf(txt) > -1 && me.selected_exchange == stock.exchange) {
                        stock.show = '';
                    }
                    else {
                        stock.show = 'hide';
                    }
                });
            }
        },
        // Shows or hides the Stock drop down list
        showList() {
            if (this.showStocks) {
                this.stocks.forEach(function (stock) { 
                    stock.show = '';
                });
                this.showStocks = false;
            }
            else {
                this.stocks.forEach(function (stock) { 
                    stock.show = 'hide';
                });
                this.showStocks = true;
            }
        },
        /* Event for when the user selects a stock exchange to search. 
           The app will filter the Stock list based on the selected Exchange.*/
        
        switchExchange() {
            let val = event.target.value;
            this.selected_exchange = val;
            this.stocks.forEach(function (stock) { 
                let ex = stock.exchange;
                if (val == ex) {
                    stock.show = '';
                }
                else {
                    stock.show = 'hide';
                }
            });
        },
        // Switches the time series for the stock. Weekly, Monthly, Daily, Intraday
        switchSeries() {
            let val = event.target.value;
            this.selected_series = val;
        },
        // Switches the time interval for the stock. 1min, 5min, 15min, 60min
        switchInterval() {
            let val = event.target.value;
            this.selected_interval = val;
        },
        /* Switches which investment type the user will work with. 
        The other dropdowns are shown or hidden based on this selection */

        switchType() {
            let val = event.target.value;
            this.selected_type = val;
            switch (val) {
                case 'currency':
                    if (this.currency_list.length == 0) {
                        this.getCurrencyListings();
                    }
                    
                    break;
                case 'crypto':
                    if (this.digital_currency.length == 0) {
                        this.getDigitalListings();
                    }
                    break;
            }
        },
        // Selection of the stock or investment object. 

        selectStock(stock) {
            let me = this;
            let start_dte = me.date_range.start;
            let end_dte = me.date_range.end;
            // Validate start date is not null
            if (start_dte == '') {
                alert('Start Date is Null');
            }
            else {
                // Validate end date is not null
                if (end_dte == '') {
                    alert('End Date is Null');
                }
                else {
                    stock.chart = {
                        data: [],
                        layout: {},
                        config: {}
                    };
                    this.selected_stock = stock;
                    this.showStocks = false;
                    this.showList();
                    // Load selected Stock's symbol into the text box.
                    document.getElementById('search-txt').value = stock.symbol;
                    //this.loadDebugger(3, 'Selected Stock: ', JSON.stringify(this.selected_stock));
                     
                    this.getStockHistory();
                }
            }
            //alert('Start Date: ' + start_dte + ' End Date: ' + end_dte);
            
        },
        getStockHistory() {
            /* Pull the selected object's history from the Alpha API */
            
            this.load_history = true;
            document.getElementById('history-tab').click();
            let in_type = this.investment_types[0];
            let stock = this.selected_stock;
            let url = in_type.url + in_type.function.base + this.selected_series + in_type.symbol + stock.symbol + in_type.interval + this.selected_interval + in_type.outputsize + in_type.apikey + this.api_key;
            this.loadDebugger(1, 'getHistory: ', url);
            let me = this;
            let graph_width = parseInt(document.getElementById('myTabContent').clientWidth);
            me.predict_disable = false;
            me.trainer.disable = false;
            axios.get(url)
                .then(function (response) {
                    let data = response.data;
                    let keys = Object.keys(data);
                    let meta = data[keys[0]];
                    let meta_keys = Object.keys(meta);
                    let list = data[keys[1]];

                    stock.last_refreshed = meta[meta_keys[2]];
                    let history = [];
                    // Create history data object
                    Object.keys(list).forEach(function (item) { 
                        let day_keys = Object.keys(list[item]);
                        let day = {
                            date: item
                        }
                        day_keys.forEach(function (key) { 
                            let head = key.split(' ')[1];
                            day[head] = list[item][key];
                        });
                        history.push(day);
                    });
                    // Reverse the date order for the history list from desc to asc
                    history.reverse();
                    /*  Bind the history data object to the App stock.history. 
                        This binding triggers the history html table to be built or updated */
                    stock.history = history;
                    // Turns of the history loading animation
                    me.load_history = false;
                    document.getElementById('sma-tab').click(); // Switch to the SMA data tab
                    // Start the SMA data loading spinner animation
                    me.load_sma = true;
                    /* Create and Bind the SMA data object to the App stock.sma data object. 
                        This binding triggers the SMA html table to be built or updated */
                    me.sma.raw = me.computeSMA(history, 50);
                    let trainer = me.trainer;
                    // Iterate the newly created sma data and create the Training Data set.
                    me.sma.raw.forEach(function (item) { 
                        let train_item = {
                            y: parseFloat(item.avg.toFixed(4)),
                            x: item.set.map(function (val_cl) { return parseFloat(val_cl[me.price_var]); })
                        };
                        trainer.raw.push(train_item);
                    }); 
                    /* Bind the Training data set to the App trainer data object. 
                       This binding triggers the Training Data html table to be built or updated */
                    trainer.data.x = me.sma.raw.map(function (val) { return val['set'].map(function (val2) { return parseFloat(val2[me.price_var]); }); });
                    trainer.data.y = me.sma.raw.map(function (val) { return parseFloat(val['avg'].toFixed(4)); });
                    // Stop the SMA data loading spinner animation
                    me.load_sma = false;
                    // Start the Trainer data loading spinner animation
                    me.train_data = true;
                    // Switch to the Training data tab
                    document.getElementById('train-tab').click();
                    // Stop the Trainer data loading spinner animation
                    me.train_data = false;
                    // Start the Stock History Graph loading animation
                    me.load_graph = true;
                    // Switch to the Stock history Graph tab
                    document.getElementById('graph-tab').click();
                    // Trigger the load Chart funciton
                    me.loadChart();
                })
                .catch(function (error) {
                    me.loadDebugger(3, 'Get Stock Data Error: ', JSON.stringify(error));
                });
        },
        loadChart() {
            let me = this;
            let id = 'history-graph';
            let parent_id = 'myTabContent';
            let title = 'Stock Chart';
            let sma = this.sma.raw;
            let stock = this.selected_stock;
            // Create the data sets to be used in the stock history chart. Trends and SMA
            let timestamps = this.selected_stock.history.map(function (val) { return val['date']; });
            let prices = this.selected_stock.history.map(function (val) { return parseFloat(val[me.price_var]); });
            let graph_width = parseInt(document.getElementById('myTabContent').clientWidth);
            let timestamps_sma = this.selected_stock.history.map(function (val) { return val['date']; }).splice(50, this.selected_stock.history.length);
            let prices_sma = sma.map(function (val) { return parseFloat(val['avg'].toFixed(4)); });
            
            timestamps_sma.forEach(function (item, index) { 
                let sma_data = {
                    date: item,
                    avg: prices_sma[index]
                }
                me.sma.data.push(sma_data);
            });
            // Stocks data and graph configs
            let stocks = {
                type: "scatter",
                mode: "lines",
                x: timestamps,
                y: prices,
                name: 'Actual Price',
                line: { color: '#17BECF' }
            };
            // SMA data and graph configs
            let ave = {
                type: "scatter",
                mode: "lines",
                x: timestamps_sma,
                y: prices_sma,
                name: 'SMA',
                line: { color: 'orange' }
            };
            // Chart layout info
            stock.chart.layout = {
                name: title,
                margin: { t: 0 },
                width: graph_width
            };
            /* Binding chart data to stock chart data
               This binding triggers the custom plotly svg chart to be built or updated */
            stock.chart.data = [stocks, ave];           // setTimeout(function () {
            me.load_graph = false;
            me.train_data = false;
            me.trainer.disable = false;
            me.train_graph = true;
            document.getElementById('train-graph-tab').click();
            // Trigger the Model Training Functions
            me.modelTrain();
        },
        // Parses a string date to be in the format of YYY-mm-dd
        changeDate() {
            let dte = event.target;
            let val = dte.value;
            let id = dte.id;
            if (id == 'start-date') {
                this.selected_stock.date_range.start = val;
            }
            else {
                this.selected_stock.date_range.end = val;
            }
        },
        // Switches between Symbol or Title
        switchStockSearch() {
            let rad = event.target;
            let val = rad.value;
            let ex = this.selected_exchange;
            let id = rad.id;
            let txt = document.getElementById('search-txt').value.toLowerCase();
            this.search_field = val;
            if (val == 'symbol') {
                this.stocks.forEach(function (stock) { 
                    if (stock.exchange == ex && stock.symbol.toLowerCase().indexOf(txt) > -1) {
                        stock.show = '';
                    }
                    else {
                        stock.show = 'hide';
                    }
                });
            }
            else {
                this.stocks.forEach(function (stock) { 
                    if (stock.exchange == ex && stock.name.toLowerCase().indexOf(txt) > -1) {
                        stock.show = '';
                    }
                    else {
                        stock.show = 'hide';
                    }
                });
            }
            
        },
        // Capitalizes the first letter of a word used in table headers
        capFirst(word) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        },
        /* Changes the Training Models training parameters and 
            retriggers the Training, Validation and Prediction processes. */
        
        loadTrainingVariables() {
            event.preventDefault();
            let me = this;
            me.trainingsize = parseInt(document.getElementById("train-size").value);
            me.n_epochs = parseInt(document.getElementById("epochs").value);
            me.learningrate = parseFloat(document.getElementById("learning-rate").value);
            me.n_hiddenlayers = parseInt(document.getElementById("hidden-layers").value);

            me.modelTrain();
        },
        // This is where the ML magic starts. The model gets trained
        async modelTrain() {
            let me = this;
            
            document.getElementById('train-graph-tab').click();
            me.train_graph = true;
            document.getElementById("div_traininglog").innerHTML = '';
            let graph_width = parseInt(document.getElementById('myTabContent').clientWidth);
            me.predict_disable = '';
            let trainer = this.trainer;
            let sma = this.sma.raw;
            let epoch_loss = [];
            let window_size = me.window_size;
            let trainingsize = me.trainingsize;
            let n_epochs = me.n_epochs;
            let learningrate = me.learningrate;
            let n_hiddenlayers = me.n_hiddenlayers;
            let inputs = trainer.data.x;/*sma.map(function (inp_f) {
                return inp_f['set'].map(function (val) { return val[me.price_var]; })
            }); */
            let outputs = trainer.data.y;//sma.map(function (outp_f) { return outp_f['avg']; });

            
            inputs = inputs.slice(0, Math.floor(trainingsize / 100 * inputs.length));
            outputs = outputs.slice(0, Math.floor(trainingsize / 100 * outputs.length));
            // This callback is used to update the progress bar and Training Chart
            let callback = function (epoch, log) {
                let logHtml = document.getElementById("div_traininglog").innerHTML;
                logHtml = "<div>Epoch: " + (epoch + 1) + " (of " + n_epochs + ")" +
                    ", loss: " + log.loss +
                    // ", difference: " + (epoch_loss[epoch_loss.length-1] - log.loss) +
                    "</div>" + logHtml;

                epoch_loss.push(log.loss);

                document.getElementById("div_traininglog").innerHTML = logHtml;
                document.getElementById("div_training_progressbar").style.width = Math.ceil(((epoch + 1) * (100 / n_epochs))).toString() + "%";
                document.getElementById("div_training_progressbar").innerHTML = Math.ceil(((epoch + 1) * (100 / n_epochs))).toString() + "%";
                
                let graph_plot = document.getElementById('div_linegraph_trainloss');
                Plotly.newPlot(graph_plot, [{ x: Array.from({ length: epoch_loss.length }, (v, k) => k + 1), y: epoch_loss, name: "Loss" }], { margin: { t: 0 } }, {displayModeBar: false});
                me.epoch = epoch + 1;
            };
            // I had to use the Object.freeze function do to Vues ability to lock onto and change objects
            me.result = Object.freeze(await trainModel(inputs, outputs, window_size, n_epochs, learningrate, n_hiddenlayers, callback));
            me.loadDebugger(3, 'Trainer Result ', JSON.stringify(me.result));
            if (me.epoch == n_epochs) {
                me.train_graph = false;
                // If the callback has completed it's epochs iteration then trigger the Validation function
                me.validateData();
                me.predict_disable = '';
            }

            
        },
        /* This function uses the trained model returned from the previous function to test its 
           predictions against the SMA and Stock History */
        validateData() {
            let me = this;
            document.getElementById('predict-tab').click();
            me.load_validate = true;
            
            let stock = me.selected_stock;
            let sma_vec = me.sma.raw;
            let inputs = sma_vec.map(function (val) { return val['set'].map(function (val2) { return parseFloat(val2[me.price_var]); }); });
            let trainingsize = me.trainingsize;
            let window_size = me.window_size;
            // validate on training
            let val_train_x = inputs.slice(0, Math.floor(trainingsize / 100 * inputs.length));
            // let outputs = sma_vec.map(function(outp_f) { return outp_f['avg']; });
            // let outps = outputs.slice(0, Math.floor(trainingsize / 100 * inputs.length));
            // console.log('val_train_x', val_train_x)
            let val_train_y = makePredictions(val_train_x, me.result['model'], me.result['normalize']);
            // console.log('val_train_y', val_train_y)

            // validate on unseen
            let val_unseen_x = inputs.slice(Math.floor(trainingsize / 100 * inputs.length), inputs.length);
            // console.log('val_unseen_x', val_unseen_x)
            let val_unseen_y = makePredictions(val_unseen_x, me.result['model'], me.result['normalize']);
            // console.log('val_unseen_y', val_unseen_y)

            let timestamps_a = stock.history.map(function (val) { return val['date']; });
            let timestamps_b = stock.history.map(function (val) { return val['date'];
            }).splice(window_size, (stock.history.length - Math.floor((100-trainingsize) / 100 * stock.history.length))); //.splice(window_size, data_raw.length);
            // let timestamps_c = data_raw.map(function (val) {
            //   return val['timestamp'];
            // }).splice(window_size + Math.floor(trainingsize / 100 * val_unseen_x.length), data_raw.length);
            let timestamps_c = stock.history.map(function (val) { return val['date'];
            }).splice(window_size + Math.floor(trainingsize / 100 * inputs.length), inputs.length);

            let sma = sma_vec.map(function (val) { return parseFloat(val['avg']); });
            let prices = stock.history.map(function (val) { return parseFloat(val[me.price_var]); });
            sma = sma.slice(0, Math.floor(trainingsize / 100 * sma.length));

            let timestamps_sma = stock.history.map(function (val) { return val['date']; }).splice(window_size, stock.history.length);
            let prices_sma = sma_vec.map(function (val) { return parseFloat(val['avg']); });
            // console.log('sma', sma)
            //alert('Before Graph');
            let graph_width = parseInt(document.getElementById('myTabContent').clientWidth);
            let graph_plot = document.getElementById('validate-graph');
            let stocks = {
                type: "scatter",
                mode: "lines",
                x: timestamps_a,
                y: prices,
                name: 'Actual Price',
                line: { color: '#17BECF' }
            };
            let ave = {
                type: "scatter",
                mode: "lines",
                x: timestamps_sma,
                y: prices_sma,
                name: 'Training Label (SMA)',
                line: { color: 'orange' }
            };
            let train = {
                type: "scatter",
                mode: "lines",
                x: timestamps_b,
                y: val_train_y,
                name: 'Predicted (train)',
                line: { color: 'red' }
            };

            let predicted = {
                type: "scatter",
                mode: "lines",
                x: timestamps_c,
                y: val_unseen_y,
                name: 'Predicted (test)',
                line: { color: 'purple' }
            };

            let data = [stocks, ave, train, predicted];
            let layout = {
                name: 'Validations Graph',
                margin: { t: 0 },
                width: graph_width
            };
            let config = {displayModeBar: false}
            // Create Chart
            Plotly.newPlot(graph_plot, data, layout, config);
           
            me.load_validate = false;
            me.load_predict = true;
            // Trigger Predict function
            me.predict();
        },
        async predict() {
            let me = this;
            let trainingsize = me.trainingsize;
            let window_size = me.window_size;
            let result = me.result;
            let stock = me.selected_stock;
            let graph_width = parseInt(document.getElementById('myTabContent').clientWidth);
            let id = 'predict-graph';
            let parent_id = 'myTabContent';
            let inputs = me.sma.raw.map(function(inp_f) {
                return inp_f['set'].map(function (val) { return parseFloat(val[me.price_var]); });
            });
            let pred_X = [inputs[inputs.length-1]];
            pred_X = pred_X.slice(Math.floor(trainingsize / 100 * pred_X.length), pred_X.length);
            let pred_y = makePredictions(pred_X, result['model'], result['normalize']);
            //window_size = parseInt(document.getElementById("input_windowsize").value);

            let timestamps_d = stock.history.map(function (val) {
                return val['date'];
            }).splice((stock.history.length - window_size), stock.history.length);

            // date
            let last_date = new Date(timestamps_d[timestamps_d.length-1]);
            let add_days = 1;
            if(me.selected_series == 'WEEKLY' || me.selected_series == 'WEEKLY_ADJUSTED'){
                add_days = 7;
            }
            last_date.setDate(last_date.getDate() + add_days);
            let next_date = await stock.last_refreshed;  //await me.formatDate(stock.last_refreshed);
            let timestamps_e = [next_date];

            let graph_plot = document.getElementById('predict-graph');
            let trends = {
                type: "scatter",
                mode: "lines+markers",
                x: timestamps_d,
                y: pred_X[0],
                name: 'Latest Trends',
                line: { color: '#17BECF' }
            };

            let predicted = {
                type: "scatter",
                mode: "lines+markers",
                x: timestamps_e,
                y: pred_y,
                name: 'Predicted Price',
                marker: {
                    color: 'red',
                        line: {
                            color: 'red',
                            width: 1,
                        },
                    symbol: 'circle',
                    size: 16
                }
            };

            let data = [trends, predicted];
            let layout = {
                name: 'Predictions Graph',
                margin: { t: 0 },
                width: graph_width
            };
            me.load_predict = false;
            let config = {displayModeBar: false}
            Plotly.newPlot(graph_plot, data, layout, config);
        }
    },
    template: `
        <header class="row">
            <h4>DLD Simple Stock Predicter<hr/></h4>
            <div class="col-md-2">
                <label class="form-label">Investment Type</label>
                <select @change="switchType" class="form-select">
                    <option value="0">Investment Type</option>
                    <template v-for="ex in investment_types">
                        <option v-if="ex.selected == 'selected'" selected :value="ex.type">{{ex.name}}</option>
                        <option v-else :value="ex.type">{{ex.name}}</option>
                    </template>
                </select>
            </div>
            <div v-if="selected_type == 'time'" class="col-md-2">
                <label class="form-label">Start Date</label>
                <input id="start-date" @change="changeDate" type="date" class="form-control" />
            </div>
            <div v-if="selected_type == 'time'" class="col-md-2">
                <label class="form-label">End Date</label>
                <input id="end-date" @change="changeDate" type="date" class="form-control" />
            </div>
            <div v-if="selected_type == 'currency'" class="col-md-3">
                <label class="form-label">Currency Exchange</label>
                <select @change="getCurrency" class="form-select">
                    <option value="0">Select Currency</option>
                    <template v-for="ex in currency_list">
                        <option :value="ex.currency_code">{{ex.currency_name}}: ({{ex.currency_code}})</option>
                    </template>
                </select>
            </div>
            <div v-if="selected_type == 'crypto'" class="col-md-3">
                <label class="form-label">Crypto & Digital Currency</label>
                <select @change="getCrypto" class="form-select">
                    <option value="0">Select Digital Currency</option>
                    <template v-for="ex in digital_currency">
                        <option :value="ex.currency_code">{{ex.currency_name}}: ({{ex.currency_code}})</option>
                    </template>
                </select>
            </div>
            <div v-if="selected_type == 'stock'" class="col-md-2">
                <label class="form-label">{{investment_types[0].function.title}}</label>
                <select @change="switchSeries" class="form-select">
                    <option value="0">Select Series Period</option>
                    <template v-for="ex in investment_types[0].function.functions">
                        <option :value="ex.name">{{ex.title}}</option>
                    </template>
                </select>
            </div>
            <div v-if="selected_type == 'stock' && selected_series == 'INTRADAY' || selected_type == 'stock' && selected_series == 'DAILY_ADJUSTED'" class="col-md-2">
                <label class="form-label">Interval</label>
                <select @change="switchInterval" class="form-select">
                    <option value="0">Select Interval</option>
                    <template v-for="ex in interval">
                        <option :value="ex">{{ex}}</option>
                    </template>
                </select>
            </div>
            <div v-if="selected_type == 'stock'" class="col-md-2">
                <label class="form-label">Select Exchange</label>
                <select @change="switchExchange" class="form-select">
                    <option value="0">Select Exchange</option>
                    <template v-for="ex in exchanges">
                        <option :value="ex">{{ex}}</option>
                    </template>
                </select>
            </div>
            <div v-if="selected_type == 'stock'" class="col-md-2 drop-cont">
                <label class="form-label">
                    <input @change="switchStockSearch" checked type="radio" name="stock-rad" value="symbol" id="symbol" /> Symbol
                    <input @change="switchStockSearch" type="radio" name="stock-rad" value="name" id="name" /> Stock Name 
                </label>
                <div class="input-group mb-3 search-cont">
                    <input @keyup="findStock" id="search-txt" type="text" class="form-control" placeholder="Stock Search" aria-label="Stock Search" aria-describedby="button-addon2">
                    <button @click="showList" class="btn btn-outline-secondary" type="button" id="button-addon2"><i class="fa fa-chevron-down"></i></button>
                </div>
                <ul v-if="stocks.length > 0" class="list-group stock-list">
                    <template v-for="stock in stocks">
                        <li v-if="search_field == 'symbol'" @click="selectStock(stock)" class="list-group-item" :class="stock.show">{{stock.symbol}}</li>
                        <li v-else-if="search_field == 'name'" @click="selectStock(stock)" class="list-group-item" :class="stock.show">{{stock.name}}</li>
                    </template>
                </ul>
            </div>
        </header>
        <main class="row">
            <div class="col-md-3 details">
               <div class="property-cont">
                    <h5>Investment Details</h5>
                    <div class="properties">
                        <template v-for="(value, key, index) in selected_stock">
                            <div v-if="key != 'history' && key != 'chart'">
                                <label>{{capFirst(key) + ': ' + value}}</label>
                            </div>
                        </template>
                    </div>
               </div>
               <div class="train">
                    <h5>Model Trainer Parameters</h5>
                    <form>
                        <div class="row mb-3">
                            <label for="train-size" class="col-sm-7 form-label">Training Dataset Size (%)</label>
                            <div class="col-sm-5">
                                <input value="70" type="number" class="form-control" id="train-size" aria-describedby="train-size">
                            </div>
                        </div>
                        <div class="row mb-3">
                            <label for="epochs" class="col-sm-7 form-label">Epochs</label>
                            <div class="col-sm-5">
                                <input type="number" value="5" class="form-control" id="epochs">
                            </div>
                        </div>
                        <div class="row mb-3">
                            <label for="learning-rate" class="col-sm-7 form-label">Learning Rate</label>
                            <div class="col-sm-5">
                                <input type="number" value="0.01" min="0.01" class="form-control" id="learning-rate" aria-describedby="learning-rate">
                            </div>
                        </div>
                        <div class="row mb-3">
                            <label for="hidden-layers" class="col-sm-7 form-label">Hidden LSTM Layers</label>
                            <div class="col-sm-5">
                                <input type="number" value="4" class="form-control" id="hidden-layers">
                            </div>
                        </div>
                        <div class="btn-group" role="group" aria-label="Train or Predict Models">
                            <button :disabled="trainer.disable" @click="loadTrainingVariables" type="submit" class="btn btn-primary">Train Model <i class="fa fa-circle-info"></i></button>
                            <button :disabled="predict_disable" @click="validateData" type="submit" class="btn btn-success">Predict Price <i class="fa fa-sack-dollar"></i></button>
                        </div>
                    </form>
               </div>
            </div>
            <div class="col-md-9 table-data">
                <ul class="nav nav-tabs" id="myTab" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="graph-tab" data-bs-toggle="tab" data-bs-target="#graph-tab-pane" type="button" role="tab" aria-controls="graph-tab-pane" aria-selected="true">
                            <span v-if="load_graph == false">Stocks</span> 
                            <span v-if="load_graph == true">Loading Stocks <i class="fa-solid fa-spinner fa-spin green"></i></span>                            
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="validate-tab" data-bs-toggle="tab" data-bs-target="#graph-validate-tab-pane" type="button" role="tab" aria-controls="graph-validate-tab-pane" aria-selected="true">
                            <span v-if="load_validate == false">Validation</span> 
                            <span v-if="load_validate == true">Loading Validation <i class="fa-solid fa-spinner fa-spin green"></i></span>                            
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="predict-tab" data-bs-toggle="tab" data-bs-target="#graph-predict-tab-pane" type="button" role="tab" aria-controls="graph-predict-tab-pane" aria-selected="true">
                            <span v-if="load_predict == false">Predictions</span> 
                            <span v-if="load_predict == true">Loading Predictions <i class="fa-solid fa-spinner fa-spin green"></i></span>                            
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="history-tab" data-bs-toggle="tab" data-bs-target="#history-tab-pane" type="button" role="tab" aria-controls="history-tab-pane" aria-selected="false">
                            <span v-if="load_history == false">History</span>  
                            <span v-if="load_history == true">Loading History <i class="fa-solid fa-spinner fa-spin green"></i></span>
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="sma-tab" data-bs-toggle="tab" data-bs-target="#sma-tab-pane" type="button" role="tab" aria-controls="sma-tab-pane" aria-selected="false">
                            <span v-if="load_sma == false">SMA Data</span> 
                            <span v-if="load_sma == true">Loading SMA <i class="fa-solid fa-spinner fa-spin purple"></i></span>
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="train-tab" data-bs-toggle="tab" data-bs-target="#train-tab-pane" type="button" role="tab" aria-controls="train-tab-pane" aria-selected="false">
                            <span v-if="train_data == false">Training Data</span>
                            <span v-if="train_data == true">Loading Training Data<i class="fa-solid fa-spinner fa-spin purple"></i></span>
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="train-graph-tab" data-bs-toggle="tab" data-bs-target="#train-graph-tab-pane" type="button" role="tab" aria-controls="train-graph-tab-pane" aria-selected="false">
                            <span v-if="train_graph == false">Training Graph</span>
                            <span v-if="train_graph == true">Loading Training Data<i class="fa-solid fa-spinner fa-spin purple"></i></span>
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="train-log-tab" data-bs-toggle="tab" data-bs-target="#train-log-tab-pane" type="button" role="tab" aria-controls="train-log-tab-pane" aria-selected="false">Training Log</button>
                    </li>
                </ul>
                <div class="tab-content" id="myTabContent">
                    <div class="tab-pane fade show active" id="graph-tab-pane" role="tabpanel" aria-labelledby="graph-tab" tabindex="0">
                        <VuePlot
                            id="history-graph"
                            :data="selected_stock.chart.data"
                            :layout="selected_stock.chart.layout"
                        ></VuePlot>
                    </div>
                    <div class="tab-pane fade" id="graph-validate-tab-pane" role="tabpanel" aria-labelledby="graph-validate-tab" tabindex="0">
                        <div id="validate-graph"></div>  
                    </div>
                    <div class="tab-pane fade" id="graph-predict-tab-pane" role="tabpanel" aria-labelledby="graph-predict-tab" tabindex="0">
                        <div id="predict-graph"></div>  
                    </div>
                    <div class="tab-pane fade" id="history-tab-pane" role="tabpanel" aria-labelledby="history-tab" tabindex="0">      
                        <history_table v-if="selected_stock.history" :history="selected_stock.history"></history_table>
                    </div>
                    <div class="tab-pane fade" id="sma-tab-pane" role="tabpanel" aria-labelledby="sma-tab" tabindex="0">
                        <history_table v-if="sma.data.length > 0" :history="sma.data"></history_table>
                    </div>
                    <div class="tab-pane fade" id="train-tab-pane" role="tabpanel" aria-labelledby="train-tab" tabindex="0">
                        <history_table v-if="trainer.raw.length > 0" :history="trainer.raw"></history_table>
                    </div>
                    <div class="tab-pane fade" id="train-graph-tab-pane" role="tabpanel" aria-labelledby="train-graph-tab" tabindex="0">
                        <div class="card">
                            <div class="card-body">
                                <h4 class="card-title">
                                    Training Model Progress
                                    <a href="#" type="button" class="link" data-bs-toggle="popover" data-bs-placement="right" data-bs-content="For MSFT, we are expecting a loss of less than 0.1. If it doesn't go below 1.0 by Epoch #5, refresh the page and try again. Note that, the browser must be active for the training to progress.">
                                        <i class="fa fa-circle-info"></i>
                                    </a>
                                </h4>
                                <div class="progress">
                                    <div id="div_training_progressbar" class="progress-bar" role="progressbar" aria-label="Basic example" style="width: 0%" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                <hr/>
                                <h6>Loss</h6>
                                <div id="div_linegraph_trainloss" style="width:100%; height:250px;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="train-log-tab-pane" role="tabpanel" aria-labelledby="train-log-tab" tabindex="0">
                        <div class="card">
                            <div class="card-body">
                                <h4 class="card-title">Training Logs</h4>
                                <div id="div_traininglog"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        <footer class="row footer">
            <div class="col debug-cont">
                <h3>{{debug_title_1}}</h3>
                <textarea class="form-control debug-txt-area" :value="debug_data_1"></textarea>
            </div>
            <div class="col debug-cont">
                <h3>{{debug_title_2}}</h3>
                <textarea class="form-control debug-txt-area" :value="debug_data_2"></textarea>
            </div>
            <div class="col debug-cont">
                <h3>{{debug_title_3}}</h3>
                <textarea class="form-control debug-txt-area" :value="debug_data_3"></textarea>
            </div>
        </footer>

    `
}).mount('#app')

