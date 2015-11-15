import assign from 'object-assign';
import ShadowElement from './ShadowElement';
import {$$} from './util';

var incubator = document.createElement('div');

function Layout () {
  if (!(this instanceof Layout)) {
    return new Layout;
  }
  this.plugins = {};
  this.rules = [];
  this.properties = {};
  this.template = '<div></div>';
}

Layout.prototype = {

  create(scope) {
    incubator.innerHTML = this.template;
    return this.parse(incubator.children[0], scope);
  },

  parse(element, scope) {
    scope = assign({}, this.plugins, scope);

    var shadow = ShadowElement(element, scope, this.properties);

    this.rules.forEach(rule => {
      $$(rule.selector, element).forEach(target => {
        ShadowElement(target).setProperty(rule.properties, ShadowElement.PRIOR_SCRIPT);
      });
    });

    return shadow;
  },

  property(properties) {
    assign(this.properties, properties);
    return this;
  },

  template(template) {
    this.template = template;
    return this;
  },

  plugin(plugins) {
    assign(this.plugins, plugins);
    return this;
  },

  style(rules) {
    Object.keys(rules).forEach(selector => {
      this.rules.push({ selector, properties: rules[selector] });
    });
    return this;
  }
};

export default Layout;
