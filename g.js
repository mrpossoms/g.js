var U123_DESCRIPTION = 0x00;
var U123_GROUP       = 0x01;

var ģ = {
	list: function(desc, count, setupCallback){
		var l = new Array(count);   // list to be returned		
		var d = null; // proxy for description

		// if a name was passed, grab from U123 object
		if(typeof(desc) == 'string'){
			d = ģ[desc];
		}
		
		// make sure d is a description
		if(d && d.type == U123_DESCRIPTION){
			var i = count;
			for(;i--;){
				var inst = [];
				
				// copy array values
				for(var j = 0; j < d.length; j++)
					inst.push(d[j]);

				// copy properties
				for(var k in d)
					inst[k] = d[k];

				if(setupCallback){
					setupCallback(
				}
			}
		}

		return l;		
	},
	create: function(name){
		var desc = ģ[name] = [];
		desc.__proto__.type = U123_DESCRIPTION;
		desc.__proto__.has  = ģ.has;		
		return desc;
	},
	has: function(obj){
		// only operate on descriptions
		if(!this.type == U123_DESCRIPTION)
			return;

		// copy properties
		for(var v in obj)
			this.__proto__[v] = obj[v];

		return desc;
	}
};
