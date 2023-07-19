/* 
    This is a custom component to create Plotly charts. I successfuly created and implemented this component 
    once in my Vue app but chose not to spend too much time on converting the other 3 charts to the Vue Plotly
    Component. I will do this later during refactoring.

*/

export const VuePlot = {
    props: {
        id: String,
        parent_id: String,
        data: Array,
        layout: Object
    },
    data() {
        return {
            headers: [],
            rows: []
        }
    },
    mounted() {
        if (this.data.length > 0) {
            this.loadPlots();
        }
        
    },
    updated() {
       if (this.data.length > 0) {
            this.loadPlots();
        }
    },
    methods: {
        loadPlots() {
            let graph = document.getElementById(this.id);
            let config = { displayModeBar: false };
            Plotly.newPlot(graph, this.data, this.layout, config);
        }
    },
    template: `
        <div class="container-fluid plot-cont">
            <div :id="id"></div>
        </div>
    `
}