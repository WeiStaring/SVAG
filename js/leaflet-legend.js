L.Control.legend = L.Control.extend({
    _map: null,

    options: {
        position: 'topright',

        // array of legend entries
        legends: [],
    },

    onAdd(map) {
        this._map = map;
        //create div
        this._container = L.DomUtil.create('div', 'leaflet-control leaflet-bar leaflet-html-legend');
        this._lastId = 0;
        this._entries = {};

        // Disable events on container
        L.DomEvent.disableClickPropagation(this._container);
        L.DomEvent.disableScrollPropagation(this._container);

        this.render();

        return this._container;
    },

    render() {
        L.DomUtil.empty(this._container);

        this.options.legends.forEach(legend => this._renderLegend(legend), this);
    },

    addLegend(legend) {
        if (this._map) {
            this._renderLegend(legend);
            return this._lastId;
        }
        throw Error('Legend control must be added to the map first.')
    },

    removeLegend(itemIdx) {
        const entry = this._entries[itemIdx]
        if (entry) {
            if (entry.layer && entry.events) {
                Object.entries(entry.events).forEach(([event, handler]) => entry.layer.off(event, handler))
            }
            L.DomUtil.remove(this._entries[itemIdx].container)
            delete this._entries[itemIdx]
        }
    },

    _renderLegend(legend) {
        if (!legend.elements) {
            return;
        }

        const elements = legend.elements;

        let className = 'legend-block';

        const block = L.DomUtil.create('div', className, this._container);
        const entryIdx = ++this._lastId;
        this._entries[entryIdx] = { container: block }

        if (this.options.collapseSimple && elements.length === 1 && !elements[0].label) {
            this._addElement(elements[0].html, legend.name, elements[0].style, block);
            return block;
        }

        if (legend.name) {
            const header = L.DomUtil.create('h4', null, block);
            L.DomUtil.create('div', 'legend-caret', header);
            L.DomUtil.create('span', null, header).innerHTML = legend.name;

            L.DomEvent.on(header, 'click', () => {
                if (L.DomUtil.hasClass(header, 'closed')) {
                    L.DomUtil.removeClass(header, 'closed');
                }
                else {
                    L.DomUtil.addClass(header, 'closed');
                }
            }, this);
        }

        const elementContainer = L.DomUtil.create('div', 'legend-elements', block);

        elements.forEach((element) => {
            this._addElement(element.html, element.label, element.style, elementContainer);
        }, this);

        return block;
    },

    _addElement(html, label, style, container) {
        const row = L.DomUtil.create('div', 'legend-row', container);
        const symbol = L.DomUtil.create('span', 'symbol', row);
        if (style) {
            Object.entries(style).forEach(([k, v]) => { symbol.style[k] = v; });
        }
        symbol.innerHTML = html;
        if (label) {
            L.DomUtil.create('label', null, row).innerHTML = label;
        }
    },

});

L.control.legend = options => new L.Control.legend(options);