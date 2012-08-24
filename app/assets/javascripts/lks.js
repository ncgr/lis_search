//
// LIS Keyword Search
//
// d3 examples
// http://mbostock.github.com/d3/
//
// Author: Ken Seal
//

var LKS = LKS || {};

//
// Cache the datasets returned from search.
//
LKS.data = LKS.data || {};

//
// Empty result set.
//
LKS.emptyResults = function() {

  d3.select("#results-empty").append("div")
    .attr("class", "empty")
    .append("span")
    .attr("class", "total-label")
    .text("Your search returned 0 QTLs");

  $(".empty").fadeOut(5000);
  $("#tools").hide();

};

//
// Default d3 colors.
//
LKS.color = LKS.color || d3.scale.category20();

//
// Known species returned in keyword search.
//
LKS.species = LKS.species || ["arahy", "phavu", "glyma"];

//
// Format lod.
//
LKS.formatLod = function(data) {

  var self = this,
      lods = [];

  _.each(data, function(v, k) {
    _.extend(v, {
      "name": v.lod ? v.lod : "not defined",
      "size": 1
    });
  });

  return data;

};

//
// Format linkage groups.
//
LKS.formatLinkageGroup = function(data) {

  var self = this,
      lg = [],
      g;

  g = _.groupBy(data, function(d) { return d.lg; });

  _.each(g, function(v, k) {
    lg.push({
      "name": k,
      "size": v.length,
      "children": self.formatLod(v)
    });
  });

  return lg;

};

//
// Format species.
//
LKS.formatSpecies = function(data) {

  var self = this,
      species,
      formatted = [];

  species = _.groupBy(data, 'species');

  _.each(species, function(v, k) {
    formatted.push({
      "name": k,
      "children": self.formatLinkageGroup(v)
    });
  });

  return formatted;

};

//
// Format data into nested JSON for tree.
//
LKS.formatNestedData = function(data) {

  var self = this,
      groups,
      formatted = {
        "name": "QTLs",
        "children": []
      };

  groups = _.groupBy(data, function(g) {
    return g.trait_name.toLowerCase();
  });

  _.each(groups, function(v, k) {
    formatted["children"].push({
      "name": k,
      "children": self.formatSpecies(v)
    });
  });

  return formatted;

};

//
// Format data.
//
LKS.formatData = function(data) {

  var self = this,
      results = [];

  _.each(data, function(v, k) {
    _.each(v, function(val, key) {
      if (_.keys(val).length > 0 ) {
        results.push(val);
      }
    });
  });

  return _.flatten(results, true);

};

//
// Render partition view.
//
LKS.renderPartition = function(data) {

  var self = this,
      data = data || self.data,
      results = "#search-results",
      tools = "#tools",
      groups,
      root,
      vis,
      partition,
      g,
      width = 1100,
      height = 600,
      kx,
      ky,
      x = d3.scale.linear().range([0, width]),
      y = d3.scale.linear().range([0, height]),
      t,
      leaf_data = [];

  groups = self.formatNestedData(data);

  root = groups;

  $(results).empty();
  $(tools).show();

  if (groups.children.length === 0) {
    return self.emptyResults();
  }

  vis = d3.select(results).append("div")
    .attr("class", "icicle")
    .style("width", width + "px")
    .style("height", height + "px")
    .append("svg:svg")
    .attr("width", width)
    .attr("height", height);

  partition = d3.layout.partition()
    .value(function(d) { return d.size; });

  g = vis.selectAll("g")
    .data(partition.nodes(groups))
    .enter().append("svg:g")
    .attr("class", "icicle-node")
    .attr("transform", function(d) {
      return "translate(" + x(d.y) + "," + y(d.x) + ")";
    })
    .on("click", click);

  kx = width / groups.dx;
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
    .text(function(d) { return d.name === "" ? "unknown" : d.name.replace("_", " "); });

  var click = function(d) {
    if (!d.children) {
      return;
    }

    // Set root to the clicked node for exporting data.
    root = d;

    kx = (d.y ? width - 40 : width) / (1 - d.y);
    ky = height / d.dx;
    x.domain([d.y, 1]).range([d.y ? 40 : 0, width]);
    y.domain([d.x, d.x + d.dx]);

    t = g.transition()
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

  // Recursively gather visible node data.
  function gatherVisibleLeafNodeData(d) {
    if (d.children) {
      d.children.forEach(gatherVisibleLeafNodeData);
    } else {
      if (_.isArray(leaf_data)) {
        leaf_data.push(d);
      } else {
        leaf_data = [];
        leaf_data.push(d);
      }
    }
  }

  // Export data set
  function exportDataSet(type, encode) {
    var base = self.exportUrls[type],
        query = "";
    encode = encode || false;
    leaf_data = [];

    gatherVisibleLeafNodeData(root);

    query += "algo=" + _.keys(leaf_data).join(",");
    _.each(leaf_data, function(v, k) {
      query += "&" + k + "_id=" + v.join(",");
    });

    // Encode URI.
    if (encode) {
      query = query.replace(/[@=&\?]/g, function(c) {
        var chars = {
          '&': '%26',
          '=': '%3D',
          '?': '%3F',
          '@': '%40'
        };
        return chars[c];
      });
    }

    window.open(base + query);
  }

  $('#table').unbind('click').bind('click', function() {
    $("#tools button").each(function() {
      $(this).removeAttr("disabled");
    });
    $("#table").attr("disabled", "disabled");
    gatherVisibleLeafNodeData(root)
    self.renderTable(leaf_data, false);
  });
};

//
// Render table view.
//
LKS.renderTable = function(data) {

  var self = this,
      data = data || self.data,
      template,
      results = $("#search-results"),
      toos = $("#tools");

  $(results).empty();
  $(tools).show();

  template = _.template(
    $("#table-view").html(), {
      data: data,
      urls: {
        "glyma": "http://soybeanbreederstoolbox.org/search/search_results.php?category=QTLName&search_term=",
        "arahy": "http://soybase.org:8089/qtls/",
        "phavu": "http://soybase.org:8090/qtls/"
      }
    }
  );

  $("#search-results").html(template);

};

//
// Remove table row from table view.
//
LKS.removeTableRow = function(el) {

  var self = this;

  $(el).parent().slideUp("slow", function() {
    $(this).remove();
  });

};

//
// Render interactive menu.
//
LKS.renderMenu = function() {

  var self = this,
      menu = $("#results-menu"),
      loading = $("#menu-loading");

  menu.show();
  loading.hide();

};


//
// Collects search results, populate LKS.data and render default view.
//
LKS.collectResults = function(data) {

  var self = this;

  self.data = self.formatData(data);

  // Render menu
  self.renderMenu();

  // Render view
  self.renderPartition(self.data);

};

