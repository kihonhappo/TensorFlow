/* This is a custom Table Vue Component */

export const HistoryTable = {
    props: {
        history: Array

    },
    data() {
        return {
            headers: [],
            rows: []
        }
    },
    mounted() {
        if (this.history.length > 0) {
            this.headers = Object.keys(this.history[0]);
            this.rows = this.history;
            let parent = this.$parent;
            parent.loading = false;
        }
    },
    updated() {
       
    },
    methods: {
        capFirst(word) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }
    },
    template: `
        <div class="container-fluid table-cont">
            <table class="table table-striped table-outlined history-table">
                <thead>
                    <tr>
                        <th v-for="header in headers">{{capFirst(header)}}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in rows">
                        <td v-for="(value, key, index) in item">{{value}}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
}