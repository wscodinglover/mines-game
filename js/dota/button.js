(function(){
  var $ = DOTA;
  
  DOTA.Button = function(config){
    this.config = $.extend({
      text : "按钮",
      position : "",
      enable : true,
      left : 0,
      top : 0,
      width : 0,
      height : 0,
      className : ["d_button", "d_button_hover", "d_button_down"],
      onMouseOver : function(){},
      onMouseOut : function(){},
      onClick : function(){}
    }, config || {});
    
    this.init();
  };
  DOTA.Button.prototype = {
    init : function(){
      var b = this._button = document.createElement("div"), c = this.config, evt = $.event;
      b.className = c.className[0];
      
      var bd = this._buttonBorder = document.createElement("div");
      bd.className = "d_button_border";
      
      bd.innerHTML = c.text;
      b.appendChild(bd);
      b.hideFocus = "hideFocus";
      if(c.position){
        b.style.position = c.position;
        b.style.left = c.left + "px";
        b.style.top = c.top + "px";
      }
      if(c.width > 0){
        b.style.width = c.width + "px";
        b.style.height = c.height + "px";
        b.style.lineHeight = c.height + "px";
      }
      
      this._onMouseOver = evt.bindEvent(this, this.onMouseOver);
      this._onMouseOut = evt.bindEvent(this, this.onMouseOut);
      this._onClick = evt.bindEvent(this, this.onClick);
      this._onMouseDown = evt.bindEvent(this, this.onMouseDown);
      this._onMouseUp = evt.bindEvent(this, this.onMouseUp);
      
      if(c.enable){
        this.setEvent(true);
      }
    },
    getWidth : function(){
      return ret = parseInt($.dom(this._button).currentStyle().width);
    },
    getHeight : function(){
      return parseInt($.dom(this._button).currentStyle().height);
    },
    setText : function(text){
      this._buttonBorder.innerHTML = text;
    },
    setPosition : function(x, y){
      this._button.style.left = x + "px";
      this._button.style.top = y + "px";
    },
    show : function(){
      this._button.style.display = "";
    },
    hide : function(){
      this._button.style.display = "none";
    },
    renderTo : function(container){
      container.appendChild(this._button);
    },
    onMouseOver : function(){
      if(this.config.className[1] != ""){
        this._button.className = this.config.className[1];
      }
      this.config.onMouseOver();
    },
    onMouseOut : function(){
      if(this.config.className[1] != ""){
        this._button.className = this.config.className[0];
      }
      this.removeCss(this.config.className[2]);
      this.config.onMouseOut();
    },
    onClick : function(){
      this.config.onClick();
    },
    onMouseDown : function(){
      this._button.className += " " + this.config.className[2];
    },
    onMouseUp : function(){
      this._button.className = this._button.className.replace(new RegExp(" " + this.config.className[2], "ig"), "");
    },
    setEnable : function(val){
      if(this.config.enable){
        this.setEvent(false);
      }
      this.config.enable = !!val;
      if(val){
        this.setEvent(true);
      }
    },
    toggleCss : function(css){
      $.css.toggle(this._button, css);
    },
    addCss : function(css){
      $.css.add(this._button, css);
    },
    removeCss : function(css){
      $.css.remove(this._button, css);
    },
    setEvent : function(val){
      var b = this._button, evt = $.event;
      if(val){
        evt.addEvent(b, "mouseover", this._onMouseOver);
        evt.addEvent(b, "mouseout", this._onMouseOut);
        evt.addEvent(b, "click", this._onClick);
        evt.addEvent(b, "mousedown", this._onMouseDown);
        evt.addEvent(b, "mouseup", this._onMouseUp);
      }else{
        evt.removeEvent(b, "mouseover", this._onMouseOver);
        evt.removeEvent(b, "mouseout", this._onMouseOut);
        evt.removeEvent(b, "click", this._onClick);
        evt.removeEvent(b, "mousedown", this._onMouseDown);
        evt.removeEvent(b, "mouseup", this._onMouseUp);
      }
    },
    dispose : function(){
      var b = this._button;	
      if(this.config.enable){
        this.setEvent(false);
      }
      
      b.innerHTML = "";
      b.parentNode && b.parentNode.removeChild(b);
    }
  };
  
  })();
  