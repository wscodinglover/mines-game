(function(){
  var $ = DOTA;
  
  function debug(msg){
    $.$("debug").innerHTML +=  msg + "</br>";
  }
  
  var UNIT = function(){
    this.flag = 0;
    this.value = 0;
    this.isClick = false;
  };
  var LEVEL = {
    simple : 0,
    normal : 1,
    hard   : 2,
    super  : 3,
    custom : 4
  };
  var LDATA = [
    [9, 9, 10],
    [16, 16, 40],
    [16, 30, 99],
    [16, 32, 128],
    [20, 20, 60]
  ];
  var STATE = {
    wait	: 0,
    start	: 1,
    stop	: 2
  };
  var CLICKINFO = {
    target 	: null,
    button 	: -1,
    time	: 0,
    para	: [],
    set		: function(target, b, t, p){
      if(this.target == null){
        this.button = b;
      }else{
        this.button += b;
      }
      this.target = target;
      this.time = t;
      this.para = p;
      if(this.button >= 3 && !$.browser.ie){
        return true;
      }
      return false;
    }
  };
  
  var Game = {
    version : 0.2,
    data : [],
    row : 0,
    col : 0,
    mines : 0,
    time : 0,
    count : 0,
    timerID : 0,
    flag : 1,
    color : true,
    music : false,
    isBoth : false,
    state : STATE.wait,
    clickInfo : CLICKINFO,
    top : [],
    wav : [['sound/win.mp3','win'],['sound/lose.mp3','lose'],['sound/timer.mp3','timer']],
    token : "",
    init : function(elem, config){
      this.element = $.$(elem);
      this.config = $.extend({
        level	: LEVEL.simple,
        flag	: true,
        color	: true,
        music	: false
      }, config || {});
      
      this.loadConfig();
      this.initUI();
      this.setLevel();
      this.initEvent();
      this.start();
      this.initSound();
      this.loadTopInfo();
    },
    initUI : function(){
      var cfg = this.config, e = $.event, self = this;
      var win = this.win = new $.Window({parent:this.element, title:"扫雷Online", width:280, height:371, onUnLoad : function(){self.exit();}});
      win.MaxButton.setEnable(false);
      this.dlg = new $.Window({isShowMask:true, isShow:false, isClear:false, opacity:20, borderStyle: $.BorderStyle.dialog, zIndex:2000, isRegister: true});
      
      var menu = this.menu = new DOTA.MENU.Menu({id : "mainMenu", items : [
      {
        text : '游戏(G)',
        menu : {
          items : [
            {
              text : '开局　　　　F2', handle: e.bindEvent(self, self.onCommand, 'start')
            }, '-', {
              text : '初级', handle: e.bindEvent(self, self.onCommand, 'simple')
            }, {
              text : '中级', handle: e.bindEvent(self, self.onCommand, 'normal')
            }, {
              text : '高级', handle: e.bindEvent(self, self.onCommand, 'hard')
            }, {
              text : '特级', handle: e.bindEvent(self, self.onCommand, 'super')
            }, {
              text : '自定义...', handle: e.bindEvent(self, self.onCommand, 'custom')
            }, '-', {
              text : '标记', handle: e.bindEvent(self, self.onCommand, 'flag')
            }, {
              text : '颜色', handle: e.bindEvent(self, self.onCommand, 'color')
            }, {
              text : '声音', handle: e.bindEvent(self, self.onCommand, 'music')
            }, '-', {
              text : '扫雷英雄榜...', handle: e.bindEvent(self, self.onCommand, 'top')
            }, '-', {
              text : '退出', handle: e.bindEvent(self, self.onCommand, 'exit')
            }
          ]
        }
      }, {
        text : '帮助(H)',
        menu : {
          items : [
             { text : '关于　　　　F1', handle: e.bindEvent(self, self.onCommand, 'help') }
          ]
        }
      }
      ]});
      win.toolBar.add({menu: menu});
      win.toolBar.render();
      win.resize();
      
      var html = "<div id='gameArea' class='gameArea'>" + 
          "<div id='info' class='info'><div class='left'><div id='mines' class='mines'><b></b><b></b><b></b></div></div><div class='middle'><div id='smile' class='smile'></div></div><div class='right'><div id='time' class='time'><b></b><b></b><b></b></div></div></div>" +
          "<div id='map' class='map'></div>"
        "</div>";
      win.setContent(html);
      
      //
      this.gameArea = $.$("gameArea");
      this.oSmile = $.$("smile");
      this.oMines = $.$("mines").getElementsByTagName("b");
      this.oTime  = $.$("time").getElementsByTagName("b");
      this.smile = new DOTA.Button({
        text:"", 
        className:["d_smile", "", "d_smile_down"], 
        onClick : function(){self.start();}
      });
      this.smile.renderTo(this.oSmile);
      this.menu.setFlag(0, 8, this.flag == 1 ? true : false);
      this.menu.setFlag(0, 9, this.color);
      this.menu.setFlag(0, 10, this.music);
      if(!this.color){
        $.css.toggle(this.gameArea, "gray");
      }
    },
    initMap : function(){
      var m = LDATA[this.config.level]
      var g = this.oMap = $.$("map");
      var tb = "<table id='gTable' class='gTable' cellpadding='0' cellspacing='0' border='0'>"
      tb +=  new Array(m[0]+1).join("<tr>" + new Array(m[1]+1).join("<td></td>") + "</tr>");
      tb += "</table>";
      g.innerHTML = tb;
      this.oTable = $.$("gTable");
    },
    refreshMines : function(){
      var s = ("000" + this.mines).slice(-3);
      for(var i = 0; i < 3; i++){
        this.oMines[i].className = "num_" + s.charAt(i);
      }
    },
    refreshTime : function(){
      var s = ("000" + this.time).slice(-3);
      for(var i = 0; i < 3; i++){
        this.oTime[i].className = "num_" + s.charAt(i);
      }
    },
    countMine : function(row, col){
      var d = this.data, count = 0;
      for(var i = row - 1; i <= row + 1; i++){
        for(var j = col - 1; j <= col + 1; j++){
          if(d[i] && d[i][j] && d[i][j].value == 9){
            count++;
          }
        }
      }
      return count;
    },
    initMine : function(){
      var t = this.oTable, r, c;
      delete this.data;
      this.data = [];
      for(var i = 0; i < this.row; i++){
        this.data[i] = [];
        for(var j = 0; j < this.col; j++){
          this.data[i][j] = new UNIT();
          t.rows[i].cells[j].para = i + "|" + j;
          t.rows[i].cells[j].className = "m_normal";
        }
      }
      for(i = 0; i < this.mines; i++){
        while(true){
          r = parseInt(this.row * Math.random());
          c = parseInt(this.col * Math.random());
          if(this.data[r][c].value == 0){
            break;
          }
        }
        this.data[r][c].value = 9;
        //t.rows[r].cells[c].className = "m_mine";
      }
      for(i = 0; i < this.row; i++){
        for(j = 0; j < this.col; j++){
          if(this.data[i][j].value == 0){
            this.data[i][j].value = this.countMine(i, j);
            //t.rows[i].cells[j].className = "m_" + this.data[i][j].value;
          }
        }
      }
    },
    initSound : function(){
      this.sound = new $.SoundLoader({sounds: this.wav, preLoad:false });
    },
    setLevel : function(){
      var level = this.config.level;
      this.row = LDATA[level][0];
      this.col = LDATA[level][1];
      this.mines = LDATA[level][2];
      
      var width = 16 * this.col + 24,
        height = 16 * this.row + 111;
      this.win.resizeTo(width, height);
      this.config.level = level;
      
      for(var i = 0; i < 5; i++){
        this.menu.setFlag(0, i + 2,false);
      }
      this.menu.setFlag(0, level + 2, true);
      this.initMap();
      this.saveConfig("level", this.config.level);
    },
    setFlag : function(){
      this.flag = -this.flag * 1 + 1;
      this.menu.setFlag(0, 8, this.flag == 1 ? true : false);
      this.saveConfig("flag", this.flag);
    },
    setColor : function(){
      this.color = !this.color;
      this.menu.setFlag(0, 9, this.color);
      $.css.toggle(this.gameArea, "gray");
      this.saveConfig("color", this.color ? 1 : 0);
    },
    setMusic : function(){
      this.music = !this.music;
      this.menu.setFlag(0, 10, this.music);
      this.saveConfig("music", this.music ? 1 : 0);
    },
    fmtPara : function(para){
      var ret = [-1,-1];
      if(para && para.indexOf("|") > 0){
        ret = para.split("|");
        ret[0] = parseInt(ret[0], 10);
        ret[1] = parseInt(ret[1], 10);
      }
      return ret;
    },
    initEvent : function(){
      var self = this;
      document.oncontextmenu = function(){
        return false;
      };
      this.oMap.onmousedown = function(evt){
        if(self.state != STATE.start) return;
        evt = evt || window.event;
        var target = evt.srcElement || evt.target, para = self.fmtPara(target.para);
  
        if(target.tagName == "TD" && para.length > 0){
          switch(evt.button){
            case 0:
            case 1:
              self.onLMouseDown(target, para); break;
            case 2:
              self.onRMouseDown(target, para); break;
            case 3:
              self.onLRMouseDown(target, para); break;
          }
        }
      };
      
      this.oMap.onmousemove = function(evt){
        if(self.state != STATE.start) return;
        evt = evt || window.event;
        var target = evt.srcElement || evt.target, para = self.fmtPara(target.para);
        if(self.clickInfo.target && target.tagName == "TD" && para.length > 0){
          self.onMouseMove(target, para);
        }else if(target.tagName == "DIV"){
          self.onMouseOut();
        }
      };
      
      this.oMap.onmouseout = function(evt){
        if(self.state != STATE.start || !self.clickInfo.target) return;
        evt = evt || window.event;
        var target = evt.srcElement || evt.target;
        if(target.tagName == "DIV"){
          self.onMouseOut();
        }
      };
      
      this.oMap.onmouseup = function(evt){
        if(self.state != STATE.start) return;
        evt = evt || window.event;
        var target = evt.srcElement || evt.target, para = self.fmtPara(target.para);
          
        if(evt.button == 0 || evt.button == 1){
          self.onLMouseUp(target, para);
        }else{
          self.onRMouseUp(target, para);
        }
      };
      
    },
    onLMouseDown : function(td, para){
      var d = this.data, i = para[0], j = para[1];
      var isBoth = this.clickInfo.set(td, 1, new Date(), para);
      if(isBoth){
        this.onLRMouseDown(td, para);
        return;
      }
      if(!d[i][j].isClick){
        td.className = "m_0";
      }
      this.smile.addCss("d_smile_press");		
    },
    onRMouseDown : function(td, para){
      var d = this.data, i = para[0], j = para[1], t = this.oTable;
      var isBoth = this.clickInfo.set(td, 2, new Date(), para);
      if(isBoth){
        this.onLRMouseDown(td, para);
        return;
      }
      if(!d[i][j].isClick){
        d[i][j].flag++;
        if(d[i][j].flag > this.flag + 1){ //2
          d[i][j].flag = 0;
        }
        if(d[i][j].flag == 1){
           this.mines--;
           this.count++;
        }
        if(this.flag == 1 && d[i][j].flag == 2 || this.flag == 0 && d[i][j].flag == 0){
           this.mines++;
           this.count--;
        }
        this.refreshMines();
        this.click(-1, -1);
        
        t.rows[i].cells[j].className = "f_" + d[i][j].flag;
      }
    },
    onLRMouseDown : function(td, para){
      var d = this.data, i = para[0], j = para[1], t = this.oTable;
      
      this.isBoth = true;
      this.openAround(td, para, false, true);
    },
    onMouseMove : function(td, para){
      var d = this.data, i = para[0], j = para[1];
      if(td == this.clickInfo.target || this.clickInfo.button == 2){
        return;
      }
      var m = this.clickInfo.para[0], n = this.clickInfo.para[1];
      if(!this.isBoth){
        if(!d[m][n].isClick){
          this.clickInfo.target.className = "m_normal";
        }
      }else{
        this.openAround(this.clickInfo.target, this.clickInfo.para, false, false);
        this.openAround(td, para, false, true);
      }
      if(d[i][j].isClick == false) td.className = "m_0";
      this.clickInfo.target = td;
      this.clickInfo.para = para;
    },
    onMouseOut : function(){
      if(this.clickInfo.target){
        var m = this.clickInfo.para[0], n = this.clickInfo.para[1];
        if(!this.data[m][n].isClick){
          this.clickInfo.target.className = "m_normal";
        }
        if(this.isBoth){
          this.openAround(this.clickInfo.target, this.clickInfo.para, false, false);
        }
        this.clickInfo.target = null;
        this.smile.removeCss("d_smile_press");
      }
    },
    onLMouseUp : function(td, para){
      var d = this.data, i = para[0], j = para[1];
      if(i < 0 || j < 0){
        this.clickInfo.target = null;
        return;
      }
      if(this.isBoth){ //左右键放开
        this.isBoth = false;
        if(!d[i][j].isClick){
          if(d[i][j].flag == 0){
            td.className = "m_normal";
          }else{
            td.className = "f_" + d[i][j].flag;
          }
        }
        this.openAround(td, para, true, false);
      }else{ //左键放开
        if(d[i][j].flag != 1){ //点击已标记为雷方块不做处理
          this.smile.removeCss("d_smile_press");
          
          if(d[i][j].value == 9){
            this.gameOver();
            return;
          }
          this.click(i, j);
          if(d[i][j].value == 0){
            this.openMap([[i, j]]);
          }
        }
      }
      if(this.timerID == 0 && this.state == STATE.start){
        var self = this;
        this.timerID = setInterval(function(){self.onTimer();}, 1000);
      }
      this.clickInfo.target = null;
    },
    onRMouseUp : function(td, para){
      var d = this.data, i = para[0], j = para[1];
      if(this.isBoth){//左右键放开
        this.openAround(td, para, true, false);
      }
      this.smile.removeCss("d_smile_press");
      this.clickInfo.target = null;
    },
    click : function(i, j){
      var d = this.data, t = this.oTable;
      if(i >= 0 && j >= 0 && d[i][j].isClick == false){
        d[i][j].isClick = true;
        t.rows[i].cells[j].className = "m_" + d[i][j].value;
        this.count++;
      }
      //检测是否结束
      if(this.count == this.row * this.col){
        this.gameWin();
      }
    },
    openAround : function(td, para, isOpen, isPress){
      var d = this.data, m = para[0], n = para[1], t = this.oTable;
      var nCount = 0, flagCount = 0, stack = [];
      if(d[m][n].value == 0 && d[m][n].isClick){ //点在空白处
        return;
      }
      if(d[m][n].isClick && isOpen){ //统计周围方块已标记雷数
        nCount = d[m][n].value
        for(var i = m - 1; i <= m + 1; i++){
          for(var j = n - 1; j <= n + 1; j++){
            if(d[i] && d[i][j] && !(i == m && j == n)){
              if(d[i][j].flag == 1){
                flagCount++;
              }
            }
          }
        }
        isOpen = false;
      }
  
      for(var i = m - 1; i <= m + 1; i++){
        for(var j = n - 1; j <= n + 1; j++){
          if(d[i] && d[i][j] && !(i == m && j == n)){
            if(nCount > 0 && nCount == flagCount ){ //打开周围方块
              if(d[i][j].flag != 1 && d[i][j].isClick == false){
                this.click(i, j);
                if(d[i][j].value == 0){
                  stack.push([i,j]);
                }
              }else if(d[i][j].flag == 1 && d[i][j].value != 9){ //标记错误
                this.gameOver();
                return;
              }
            }else{
              if(d[m][n].isClick == false || !isOpen){ //当前操作点未点开或雷标记数量不对
                if(d[i][j].isClick == false && d[i][j].flag == 0){
                  t.rows[i].cells[j].className = "m_" + (isPress ? "0" : "normal");
                }
              }
            }
          }
        }
      }
      if(stack.length > 0){
        this.openMap(stack);
      }
    },
    openMap : function(stack){
      var d = this.data, t = this.oTable;
      while(stack.length > 0){
        var m = stack[0][0], n = stack[0][1];
        for(var i = m - 1; i <= m + 1; i++){
          for(var j = n - 1; j <= n + 1; j++){
            if(d[i] && d[i][j] && d[i][j].isClick == false && d[i][j].flag != 1){ //未标记为雷
              this.click(i, j);
              if(d[i][j].value == 0){
                stack.push([i,j]);
              }
            }
          }
        }
        stack.shift();
      }
    },
    onCommand : function(oEvent, command){
      var dlg = this.dlg;
      switch(command){
        case "start"	:   //开始
          this.start(); break;
        case "simple"	: 
        case "normal"	: 
        case "hard"		:   //难度选择
        case "super"	:
          this.config.level = LEVEL[command]; 
          this.setLevel(); 
          this.start(); 
          break;
        case "flag"		:
          this.setFlag(); break;
        case "color"	:
          this.setColor(); break;
        case "music"	:
          this.setMusic(); break;
        case "custom"	:   //自定义
          dlg.setTitle("自定义雷区");
          dlg.loadUrl("html/custom.html");
          dlg.resizeTo(250, 150);
          dlg.show();
          break;
        case "top"		: //排行榜
          dlg.setTitle("扫雷英雄榜");
          dlg.loadUrl("html/top.html?"+new Date().getTime());
          dlg.resizeTo(400, 320);
          dlg.show();
          break;
        case "exit"		: //退出
          this.exit(); break;
        case "help":
          dlg.setTitle("关于...");
          dlg.loadUrl("html/about.html?v=20190617");
          dlg.resizeTo(270, 180);
          dlg.show();
          break;
      }
    },
    onTimer : function(){
      if(this.time < 999){
        this.time++;
        this.refreshTime();
      }
      if(this.music){
        this.sound.play("timer");
      }
    },
    start : function(){
      this.stop();
      this.state = STATE.start;
      this.smile.removeCss("d_smile_over");
      this.smile.removeCss("d_smile_win");
      this.count = 0;
      this.time = 0;
      this.timerID = 0;
      this.mines = LDATA[this.config.level][2];
      this.initMine();
      this.refreshMines();
      this.refreshTime();
    },
    stop : function(){
      console.log('stop')


      this.state = STATE.stop;
      this.clickInfo.target = null;
      clearInterval(this.timerID);
      this.timerID = 0;
      
    },
    isTop : function(){
      if(this.time < this.top[this.config.level][4].time){
        var dlg = this.dlg;
        dlg.setTitle("恭喜！");
        dlg.loadUrl("html/win.html");
        dlg.resizeTo(200, 180);
        dlg.show();
        return true;
      }
      return false;
    },
    gameWin : function(){
      if(this.music) this.sound.play("win");
      this.stop();
      this.smile.addCss("d_smile_win");
      console.log('gameWin before')
      var dlg = this.dlg
      dlg.setTitle("恭喜！");
      dlg.loadUrl("html/win.html");
      dlg.resizeTo(200, 180);
      dlg.show();

      console.log('gameWin after',this.config.level,LEVEL.custom )
      if(this.config.level == LEVEL.custom ){
        console.log('gameWin after',this.config.level,LEVEL.custom )
        alert("win");
      }
    },
    gameOver : function(){
      if(this.music) this.sound.play("lose");
      this.stop();
      this.smile.addCss("d_smile_over");
      console.log('gameOver')
      
      var d = this.data, t = this.oTable;
      for(var i = 0; i < this.row; i++){
        for(var j = 0; j < this.col; j++){
          if(d[i][j].isClick == false){
            if(d[i][j].flag == 1){ //已设置雷标记
              if(d[i][j].value == 9){ //标记正确
                t.rows[i].cells[j].className = "m_mine";
              }else{ //标记错误
                t.rows[i].cells[j].className = "m_notmine";
              }
            }else{ //未设置
              t.rows[i].cells[j].className = "m_" + d[i][j].value;
            }
          }
        }
      }
    },
    saveConfig : function(key, value){
      $.cookie.set(key, value);
    },
    loadConfig : function(){
      var level, flag, color, music, row, col, mines;
      level = parseInt($.cookie.get("level"), 10);
      if(!isNaN(level)&& level >= LEVEL.simple && level <= LEVEL.custom){		
        if(level == 4){
          row = parseInt($.cookie.get("row"), 10);
          col = parseInt($.cookie.get("col"), 10);
          mines = parseInt($.cookie.get("mines"), 10);
          this.customInfo([row, col, mines], false);
        }else{
          this.config.level = level;
        }
      }
      flag = parseInt($.cookie.get("flag"), 10);
      if(flag === 0 || flag === 1) this.flag = flag;
      
      color = parseInt($.cookie.get("color"), 10);
      if(color === 0 || color === 1) this.color = color == 1 ? true : false;
      
      music = parseInt($.cookie.get("music"), 10);
      if(music === 0 || music === 1) this.music = music == 1 ? true : false;
    },
    loadTopInfo : function(isShow){
      // var self = this;
      // new $.Ajax().get("html/top.asp", false, function(xhr){
      //   eval(xhr.responseText);
      //   if(obj && obj.top && obj.token){
      //     self.top = obj.top;
      //     self.token = obj.token;
      //     if(isShow){
        // this.onCommand("top");
      //     }
      //   }else{
      //     alert("读取数据错误，请刷新页面！");
      //   }
      // });
    },
    closeDialog : function(){
      this.dlg.hide();
    },
    customInfo : function(data){
      if(data){
        if(data.length == 3 && data[0] >= 10 && data[0] <= 24
        && data[1] >= 10 && data[0] <= 30 
        && data[2] >= 5 && data[2] <= 666 && data[2] < data[0] * data[1] ){
          LDATA[LEVEL.custom][0] = data[0];
          LDATA[LEVEL.custom][1] = data[1];
          LDATA[LEVEL.custom][2] = data[2];
          this.config.level = LEVEL.custom; 
          if(arguments.length == 1){
            this.setLevel(); 
            this.start();
            this.saveConfig("row", data[0]);
            this.saveConfig("col", data[1]);
            this.saveConfig("mines", data[2]);
          }
        }
      }else{
        return LDATA[LEVEL.custom];
      }
    },
    mapSerialize : function(){
      var ret = [], d = this.data;
      for(var i = 0; i < this.row; i++){
        for(var j = 0; j < this.col; j++){
          ret.push(d[i][j].value);
        }
      }
      return ret.join("");
    },
    getUserInfo : function(){
      if(this.state == STATE.stop) return {
        level : this.config.level,
        levelName : ["初级", "中级", "高级", ""][this.config.level],
        time : this.time,
        token: this.token,
        map : this.mapSerialize(),
        record : ""
      };
    },
    refreshTop : function(result){
      this.dlg.hide();
      if(!result){
        alert("数据保存失败！");
      }else{
        this.loadTopInfo(true);
      }
    },
    showData: function(e, type, index){
      
    },
    exit : function(){
      this.dispose();
    },
    dispose : function(){
      this.stop();
      this.win.close();
      this.dlg.close(true);
      this.gameArea.innerHTML = "";
    }
  };
  
  var GamePlayer = {
    init: function(){
      var win = this.win = new $.Window({isShowMask:true, isShow:false, isClear:false, title:'游戏截屏', borderStyle: $.BorderStyle.dialog, zIndex:3000, isRegister: true});
      var html = "<div id='gameArea_P' class='gameArea'>" + 
          "<div id='info_P' class='info'><div class='left'><div id='mines_P' class='mines'><b></b><b></b><b></b></div></div><div class='middle'><div id='smile_P' class='smile'></div></div><div class='right'><div id='time_P' class='time'><b></b><b></b><b></b></div></div></div>" +
          "<div id='map_P' class='map'></div><div id='userName' class='userName'></div>"
        "</div>";
      win.setContent(html);
      this.gameArea = $.$("gameArea_P");
      this.oSmile = $.$("smile_P");
      this.oMines = $.$("mines_P").getElementsByTagName("b");
      this.oTime  = $.$("time_P").getElementsByTagName("b");
      this.oUser = $.$("userName");
      var self = this;
      this.style = "m_flag";
      this.smile = new DOTA.Button({
        text:"", 
        className:["d_smile", "", "d_smile_down"],
        onClick : function(){self.changeStyle();}
      });
      this.smile.renderTo(this.oSmile);
      this.level = 0;
      this.index = 0;
    },
    initMap : function(){
      var m = LDATA[this.level]
      var g = this.oMap = $.$("map_P");
      var tb = "<table id='gTable_P' cellpadding='0' cellspacing='0' border='0'>"
      tb +=  new Array(m[0]+1).join("<tr>" + new Array(m[1]+1).join("<td></td>") + "</tr>");
      tb += "</table>";
      g.innerHTML = tb;
      this.oTable = $.$("gTable_P");
    },
    setLevel : function(){
      var level = this.level;
      this.row = LDATA[level][0];
      this.col = LDATA[level][1];	
      this.mines = LDATA[level][2];
      var width = 16 * this.col + 24,
        height = 16 * this.row + 111;
      this.win.resizeTo(width, height);
      
      this.initMap();
    },
    initMine : function(onlyMine){
      var data = Game.top[this.level][this.index];
      var map = data.map;
      var t = this.oTable, r, c, k, m, css, s;
      for(var i = 0; i < this.row; i++){
        for(var j = 0; j < this.col; j++){
          k = i * this.col + j;
          m = map[k];
          if(m == '9'){
            css = this.style;
          }else{
            css = 'm_' + m;
          }
          t.rows[i].cells[j].className = css;
        }
      }
      if(onlyMine){
        return;
      }
      s = ("000" + this.mines).slice(-3);
      for(var i = 0; i < 3; i++){
        this.oMines[i].className = "num_" + s.charAt(i);
      }
      s = ("000" + data.time).slice(-3);
      for(var i = 0; i < 3; i++){
        this.oTime[i].className = "num_" + s.charAt(i);
      }
      var d = new Date(data.date);
      var date = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
      this.win.setTitle('游戏截屏-' + date);
      this.oUser.innerHTML = data.name;
    },
    changeStyle: function(){
      if(this.style == "m_flag"){
        this.style = "m_mine";
      }else{
        this.style = "m_flag";
      }
      this.initMine(true);
    },
    show: function(e, type, index){
      this.level = type;
      this.index = index;
      this.setLevel();
      this.win.show();
      this.initMine();
    }
  };
  Mine = {
    init : function(element){
      Game.init(element);
      GamePlayer.init();
    },
    closeDialog : function(){
      Game.closeDialog();
    },
    topInfo : function(){
      return Game.top;
    },
    getUserInfo : function(){
      return Game.getUserInfo();
    },
    refreshTop : function(result){
      return Game.refreshTop(result);
    },
    customInfo : function(data){
      if(data){
        Game.customInfo(data);
      }else{
        return Game.customInfo();
      }
    },
    showData: function(e, type, index){
      GamePlayer.show(e, type, index);
    }
  };
  
  })();