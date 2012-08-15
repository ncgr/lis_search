LisSearch.SearchSoybasesView = Ember.View.extend({
  tagName:      'form',
  templateName: 'ember/templates/soybases/search',

  init: function() {
    this._super();
    this.set('soybase', LisSearch.Soybase.create());
  },

  submit: function(event) {
    var self    = this;
    var soybase = this.get('soybase');

    event.preventDefault();

    $.ajax({
      type: 'GET',
      url: soybase.resourceUrl,
      data: "q=" + soybase.q,
    }).done(function(data) {
      LisSearch.soybasesController.clearAll();
      LisSearch.soybasesController.loadAll(data);
      //LisSearch.soybasesController.get('pie');
      LisSearch.soybasesController.get('icicle');
      //LisSearch.soybasesController.get('genomicDistribution');
    });
  }
});
