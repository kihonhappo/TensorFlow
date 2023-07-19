/* This file is used to keep code tha has been discarded but could be refrenced later */

getAlphaSMA = function () {
            //alert('getHistory');
            let me = this;
            this.load_sma = true;
            document.getElementById('sma-tab').click();
            let sma = this.sma;
            let stock = this.selected_stock; //https://www.alphavantage.co/query?function=SMA&symbol=IBM&interval=weekly&time_period=10&series_type=open&apikey=demo
            let url = this.base_url + sma.api.function + sma.api.symbol + stock.symbol + sma.api.interval + this.selected_series.toLowerCase() + sma.api.time_period + sma.api.series_type + sma.api.apikey + this.api_key;
            //alert(url);
            this.loadDebugger(1, 'getSMA: ', url);
            
            axios.get(url)
                .then(function (response) {
                    //alert('Back from Get SMA: ' + JSON.stringify(response));
                    let data = response.data;
                    let sma = me.sma;
                    let keys = Object.keys(data);
                    let meta = data[keys[0]];
                    let meta_keys = Object.keys(meta);
                    let list = data[keys[1]];

                    sma.last_refreshed = meta[meta_keys[2]];
                    let sma_results = [];
                    //let tf_data = me.tf_data;
                    Object.keys(list).forEach(function (item) { 
                        let day_keys = Object.keys(list[item]);
                        let day = {
                            date: item
                        }
                        day_keys.forEach(function (key) { 
                            let head = key;//.split(' ')[1];
                            day[head] = list[item][key];
                        });
                        sma_results.push(day);
                    });
                    sma_results.reverse();
                    me.sma.raw = sma_results;
                    me.load_sma = false;
                    //let graph_width = parseInt(document.getElementById('myTabContent').clientWidth);
                    
                    
                    me.loadDebugger(1, 'SMA raw: ', JSON.stringify(sma));
                    me.loadDebugger(2, 'Lengths: ', 'Stock: ' + stock.history.length + ' SMA: ' + sma_results.length);
                    me.loadDebugger(3, 'Window Size: ', JSON.stringify(graph_width));
                    me.loadChart();
                })
                .catch(function (error) {
                    me.loadDebugger(3, 'Get Stock Data Error: ', JSON.stringify(error));
                }); 
        }

        displaySMA = function(){
            let data_raw = this.selected_stock.history;
            window_size = parseInt(document.getElementById("history-graph").value);
            this.sma_vec = ComputeSMA(data_raw, window_size);

            let sma = sma_vec.map(function (val) { return val['avg']; });
            let prices = data_raw.map(function (val) { return val['price']; });

            let timestamps_a = data_raw.map(function (val) { return val['timestamp']; });
            let timestamps_b = data_raw.map(function (val) {
                return val['timestamp'];
            }).splice(window_size, data_raw.length);

            let graph_plot = document.getElementById('div_linegraph_sma');
            Plotly.newPlot( graph_plot, [{ x: timestamps_a, y: prices, name: "Stock Price" }], { margin: { t: 0 } } );
            Plotly.plot( graph_plot, [{ x: timestamps_b, y: sma, name: "SMA" }], { margin: { t: 0 } } );

            $("#div_linegraph_sma_title").text("Stock Price and Simple Moving Average (window: " + window_size + ")" );
            
            this.displayTrainingData();
        }
        displayTrainingData = function(){
            let set = sma_vec.map(function (val) { return val['set']; });
            let data_output = "";
            for (let index = 0; index < 25; index++)
            {
                data_output += "<tr><td width=\"20px\">" + (index + 1) +
                "</td><td>[" + set[index].map(function (val) {
                    return (Math.round(val['price'] * 10000) / 10000).toString();
                }).toString() +
                "]</td><td>" + sma_vec[index]['avg'] + "</td></tr>";
            }

            data_output = "<table class='striped'>" +
            "<thead><tr><th scope='col'>#</th>" +
            "<th scope='col'>Input (X)</th>" +
            "<th scope='col'>Label (Y)</th></thead>" +
            "<tbody>" + data_output + "</tbody>" +
            "</table>";

            $("#div_trainingdata").html(
                data_output
            );
        }