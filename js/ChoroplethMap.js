jQuery.sap.declare("js.ChoroplethMap");

sap.ui.core.Control.extend("js.ChoroplethMap", {   
    metadata : {  
      properties: {
        "data": "object",
        "idField": {type : "string", defaultValue : "id"},
        "valueField": {type : "string", defaultValue : "value"}, 
      },  
      aggregations: {},  
      events: {}  
    },  
    init: function() {          
    },  
    renderer : function(oRm, oControl) {
        oRm.write("<div"); 
        oRm.writeControlData(oControl);  // writes the Control ID and enables event handling - important!
        oRm.write("style='width: 100%; height: 100%;'>");  
        oRm.write("</div>");

    },

    onBeforeRendering: function() {
      this._detachEventListeners();
    },

    onAfterRendering: function() {
      var containerId = this.getId();
      var center = (this._center) ? this._center : L.latLng(0, -10);
      var zoom = (this._zoom) ? this._zoom : 2;
      var map = this.map = L.map(containerId).setView([center.lat,center.lng], zoom);
      // http://otile1.mqcdn.com/tiles/1.0.0/map/8/126/87.jpg
      L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
          attribution: 'Data, imagery and map information provided by <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">, OpenStreetMap <http://www.openstreetmap.org/copyright> and contributors, ODbL'
      }).addTo(map);
      
      L.geoJson(countries, {
          onEachFeature: jQuery.proxy(this._popup, this),          
          style: jQuery.proxy(this._generateStyle, this),
      }).addTo(map);
      this._attachEventListeners();
    },

    onExit: function() {
      this._detachEventListeners();
    },

    _attachEventListeners: function() {      
      if (this.map) {        
        this.map.on('moveend', jQuery.proxy(this._onMoveEnd, this));
        this.map.on('zoomend', jQuery.proxy(this._onZoomEnd, this));
      }
    },

    _detachEventListeners: function() {
      if (this.map) {
        this.map.off('moveend', jQuery.proxy(this._onMoveEnd, this));
        this.map.off('zoomend', jQuery.proxy(this._onZoomEnd, this));
      }      
    },

    _onMoveEnd: function() {      
      this._saveCurrentExtent();
    },

    _onZoomEnd: function() {      
      this._saveCurrentExtent();
    },

    _saveCurrentExtent: function() {
      // keep track of current zoom and location
      this._center = this.map.getCenter();
      this._zoom = this.map.getZoom();
    },

    _generateStyle: function(feature) {
      // http://en.wikipedia.org/wiki/ISO_3166-1_alpha-3
      var featureId = feature.properties.iso_a3;      
      var value = this._getValueFromDataById(featureId);
      return {
        fillColor: this._getFillColor(value),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.9
      };
    },

    _getValueFromDataById: function(id) {      
      var value = -1;
      var data = this.getData();
      // TODO if data size is big, consider replacing array with map to improve performance
      if (data) {
        var len = data.length;
        for (var i = 0; i < len; i++) {
          var curItem = data[i];
          if (curItem && id === curItem[this.getIdField()]) {
            value = curItem[this.getValueField()];
            break;
          }
        }
      }      
      return value;
    },

    _getFillColor: function(d) {
        var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
          maxFractionDigits: 0,
          groupingSeparator: " ",
          decimalSeparator: "."
        });
        var number = -1;
        try {
          number = oNumberFormat.parse(d);
        } catch (err) {
          // console.log("some data could not be formatted");
        }
        return number > 100000 ? '#800026' :
               number > 50000  ? '#BD0026' :
               number > 20000  ? '#E31A1C' :
               number > 10000  ? '#FC4E2A' :
               number > 5000   ? '#FD8D3C' :
               number > 2000   ? '#FEB24C' :
               number > 1000   ? '#FED976' :
               number >= 0   ? '#FFEDA0' :
                          '#AAAAAA';
    },

    _popup: function(feature, layer) {
        if (feature.properties && feature.properties.iso_a3) {
            var value = this._getValueFromDataById(feature.properties.iso_a3);
            layer.bindPopup("Country: " + feature.properties.iso_a3 + " value: " + value);
        }
    },
});