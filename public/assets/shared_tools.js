module.exports = {
    parseServerMessage: function (message) {
        let msg = '';
        // console.log(message);
        if(typeof(message)=='string'){
          msg = JSON.parse(message)
        }else{
          msg = message;
        }
        return msg;
    },
    pick_color_hsl: function(alwayIncrLoopColorIdx=0){
      let colorArr = ['red', 'blue', 'green', 'orange', 'brown', 'sienna', 'blueviolet', 'darkcyan', 'hotpink'];
      let ouputColor = colorArr[alwayIncrLoopColorIdx % colorArr.length];
      alwayIncrLoopColorIdx+=1
      return ouputColor
    },

    capitalize: (s) => {
      if (typeof s !== 'string') return ''
      return s.charAt(0).toUpperCase() + s.slice(1)
    },
    
    parseCmd: function (sriptName, data=null) {
      return JSON.stringify({'cmd':sriptName, 'data':data})
    }
    
  };