var U123_DESCRIPTION = 0x00;
var U123_GROUP       = 0x01;

// ctrl-k g ,
var ģ = {
	list: function(desc, count, setupCallback){
		var l = new Array(count);   // list to be returned		
		var d = desc; // proxy for description

		// if a name was passed, grab from U123 object
		if(typeof(desc) == 'string'){
			d = ģ[desc];
		}
		
		// make sure d is a description
		if(d && d.type == U123_DESCRIPTION){
			var i = count;
			for(;i--;){
				var inst = function(){};
				
				// copy array values
				for(var j = 0; j < d.length; j++)
					inst.push(d[j]);

				// copy properties
				for(var k in d)
					inst[k] = d[k];

				// allow the user to perform manual
				// setup to the instance
				if(setupCallback){
					setupCallback(inst);
				}

				l[i] = inst;
			}
		}

		return l;		
	},
	create: function(name, properties, initializer){
		var desc = ģ[name] = function(){};
		desc.__proto__.type = U123_DESCRIPTION;
		desc.__proto__.has  = ģ.has;
		desc.__proto__._init = [];

		// add intializer function if specified
		if(typeof(intitializer) == 'function')
			desc.__proto__._init.push(initializer);

		for(var v in properties)
			desc.__proto__[v] = properties[v];

		return desc;
	},
	has: function(obj, params){
		// if it is a string look it up form ģ's description
		// collection
		if(typeof(obj) == 'string'){
			obj = new ģ[obj]();
			if(!obj) return this;
		}

		// only operate on descriptions
		if(!this.type == U123_DESCRIPTION){
			return this;
		}

		// copy properties from prototypes
		for(var v in obj.__proto__)
			with(this){
				// treat the initializers differently
				if(v == '_init')
					__proto__._init = __proto__._init.concat(obj.__proto__._init);
				else
					__proto__[v] = obj.__proto__[v];
			}

		// call all initializers if params are passed
		if(params){
			for(var i = this.__proto__._init.length; i--;)
				this.__proto__._init[i](params);
		}

		return this;
	}
};

var __ = function(){
	with(ģ){
		create('location',
			{ pos: [], rot: [] },
			function(params){
				this.pos = params.pos || [];
				this.rot = params.rot || [];
			}
		);

		create('movement',
			{ vel: [], angVel: [] },
			function(params){
				this.vel    = params.vel || [];
				this.angVel = params.angVel || [];
			}
		).has('location');

		create('physics',
			{
				mass:        1,
				friction:    1,
				restitution: 1
			},
			function(params){
				// setter
				for(var v in params)
					this.__proto__[v] = params[v] || 1;
			}
		).has('movement');
	}
}();	
