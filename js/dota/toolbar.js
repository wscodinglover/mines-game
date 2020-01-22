DOTA.ToolBarItem = function(config){
	this.config = DOTA.extend({
		icon : '',
		text : '',
		menu : null,
		field : null
	}, config || {});
	
	this.init();
};
DOTA.ToolBarItem.prototype = {
	init : function(){
		var cfg = this.config, e = this.element = document.createElement("div");
		if(cfg.menu){
			cfg.menu.renderTo(e);
		}
		if(cfg.field){
			cfg.field.renderTo(e);
		}
	},
	renderTo : function(container){
		container.appendChild(this.element);
	},
	dispose : function(){
		var cfg = this.config;
		if(cfg.menu){
			cfg.menu.dispose();
		}
		if(cfg.field){
			cfg.field.dispose();
		}
		this.element.innerHTML = "";
		this.element = null;
	}
};

DOTA.ToolBar = function(container){
	this.container = DOTA.$(container);
	this.init();
	this.items = [];
};
DOTA.ToolBar.prototype = {
	init : function(){
		var e = this.element = document.createElement("div");
		e.cssText = "position:relative;"
		e.className = "d_toolbar";
		this.container.appendChild(e);
	},
	add : function(o){
		if(typeof o == "object"){
			var i = new DOTA.ToolBarItem(o);
			this.items.push(i);
			i.renderTo(this.element);
		}
	},
	render : function(){
		this.container.style.display = "block";
		this.container.appendChild(this.element);
	},
	getHeight : function(){
		var i, o = this.items, h = 0, e;
		for( i = 0; i < o.length; i++ ){
			e = o[i].element;
			if(e.className == ""){
				e = DOTA.dom(e).firstNode();
			}
			h += parseInt(e.style.height || e.offsetHeight || DOTA.dom(e).currentStyle().height);
		}
		if(h > 0){
			h += 2;
		}
		return h;
	},
	dispose : function(){
		var i, o = this.items;
		for( i = 0; i < o.length; i++ ){
			o[i].dispose();
		}
		
		this.element.innerHTML = "";
		this.container.removeChild(this.element);
		this.items = this.element = null;
	}
};