LisSearch.soybasesController = Ember.ResourceController.create({
  resourceType: LisSearch.Soybase,

  color: d3.scale.category20(),

  graph: function() {
    var self = this;

    var data = this.get('content');

    var groups =  _.groupBy(data, function(s) {
      return s.trait_name.toLowerCase();
    });

    var slices = [];
    _.each(groups, function(g) {
      slices.push(g.length);
    });

    var sliceNames = _.map(_.keys(groups), function(k) {
      if (k === "" || k === undefined || k === null) {
        k = "unknown";
      }
      return k;
    });

    var total = _.reduce(slices, function(memo, num) { return memo + num; }, 0);

    var width = 400,
      height = 400,
      outerRadius = Math.min(width, height) / 2,
      innerRadius = outerRadius * 0.4,
      data = slices,
      arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius),
      donut = d3.layout.pie();

    var vis = d3.select("#search-results").append("div")
      .attr("class", "results")
      .append("svg")
      .attr("class", "graph")
      .data([data])
      .attr("width", width)
      .attr("height", height);

    var arcs = vis.selectAll("g.arc")
      .data(donut)
      .enter().append("g")
      .attr("class", "arc")
      .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

    var center = vis.append("svg:g")
      .attr("class", "center")
      .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

    var totalLabel = center.append("svg:text")
      .attr("class", "total-label")
      .attr("dy", -5)
      .attr("text-anchor", "middle")
      .text("Total QTLs");

    var totalValue = center.append("svg:text")
      .attr("class", "total")
      .attr("dy", 25)
      .attr("text-anchor", "middle")
      .text(total);

    var paths = arcs.append("path")
      .attr("fill", function(d, i) { return self.color(i); })
      .attr("d", arc);

    paths.transition()
      .ease("bounce")
      .duration(2000)
      .attrTween("d", function(b) {
        b.innerRadius = 0;
        var i = d3.interpolate({startAngle: 0, endAngle: 0}, b);
        return function(t) {
          return arc(i(t));
        }
      });

    var legend = d3.select(".results:last-child").append("svg")
      .attr("class", "legend")
      .data([data])
      .attr("width", 325);

    for(var i = 0; i < sliceNames.length; i++) {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", function(d, k) { return self.color(i) });
      legend.append("text")
        .attr("class", "label")
        .attr("x", 20)
        .attr("y", function(d, k) { return 10 + (i * 20) })
        .text(function(d, k) { return sliceNames[i]; });
    }

  }.property('graph'),

  formatLinkageGroup: function(data) {
    var lg = [];
    var g = _.groupBy(data, function(d) { return d.map[0].linkage_group; });
    _.each(g, function(v, k) {
      lg.push({
        "name": k,
        "size": v.length
      });
    });

    return lg;
  },

  formatData: function(data) {
    var self = this;

    var formatted = {
      "name": "QTLs",
      "children": []
    };

    groups = _.groupBy(data, function(g) {
      return g.trait_name.toLowerCase().underscore();
    });

    _.each(groups, function(v, k) {
     formatted["children"].push({
       "name": k,
       "children": self.formatLinkageGroup(v)
     });
    });

    return formatted;
  },


  icicle: function() {
    var self = this;

    var groups = self.formatData(self.get('content'));

    var width = 800,
        height = 400,
        x = d3.scale.linear().range([0, width]),
        y = d3.scale.linear().range([0, height]);

    var vis = d3.select(".results:last-child").append("div")
      .attr("class", "icicle")
      .style("width", width + "px")
      .style("height", height + "px")
      .append("svg:svg")
      .attr("width", width)
      .attr("height", height);

    var partition = d3.layout.partition()
      .value(function(d) { return d.size; });

    var g = vis.selectAll("g")
      .data(partition.nodes(groups))
      .enter().append("svg:g")
      .attr("class", "icicle-node")
      .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; })
      .on("click", click);

    var kx = width / groups.dx,
      ky = height / 1;

    g.append("svg:rect")
      .attr("width", groups.dy * kx)
      .attr("height", function(d) { return d.dx * ky; })
      .attr("class", function(d) { return d.children ? "parent" : "child"; })
      .on("click", function(d) { click(d); });

    g.append("svg:text")
      .attr("transform", function(d) { return "translate(8," + d.dx * ky / 2 + ")"; })
      .attr("dy", ".35em")
      .style("opacity", function(d) { return d.dx * ky > 12 ? 1 : 0; })
      .text(function(d) { return d.name === "" ? "unknown" : d.name; });

    var click = function(d) {
      if (!d.children) {
        return;
      }

      kx = (d.y ? width - 40 : width) / (1 - d.y);
      ky = height / d.dx;
      x.domain([d.y, 1]).range([d.y ? 40 : 0, width]);
      y.domain([d.x, d.x + d.dx]);

      var t = g.transition()
        .duration(750)
        .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; });

      t.select("rect")
        .attr("width", d.dy * kx)
        .attr("height", function(d) { return d.dx * ky; });

      t.select("text")
        .attr("transform", transform)
        .style("opacity", function(d) { return d.dx * ky > 12 ? 1 : 0; });

    }

    var transform = function(d) {
      return "translate(8," + d.dx * ky / 2 + ")";
    }

  }.property('icicle')
});
