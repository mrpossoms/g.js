var CHANGE_DESCRIPTION = 0x00;
var CHANGE_GROUP       = 0x01;

// ctrl-k g , alt j
var ∆ = {
	list: function(desc, count, setupCallback){
		var l = new Array(count);   // list to be returned		
		var d = desc; // proxy for description

		// if a name was passed, grab from CHANGE object
		if(typeof(desc) == 'string'){
			d = ∆[desc];
		}
		
		// make sure d is a description
		if(d && d.type == CHANGE_DESCRIPTION){
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
		var desc = ∆[name] = function(){};
		desc.__proto__.type = CHANGE_DESCRIPTION;
		desc.__proto__.has  = ∆.has;
		desc.__proto__._init = [];

		// add intializer function if specified
		if(typeof(intitializer) == 'function')
			desc.__proto__._init.push(initializer);

		for(var v in properties)
			desc.__proto__[v] = properties[v];

		return desc;
	},
	has: function(obj, params){
		// if it is a string look it up form ∆'s description
		// collection
		if(typeof(obj) == 'string'){
			obj = new ∆[obj]();
			if(!obj) return this;
		}

		// only operate on descriptions
		if(!this.type == CHANGE_DESCRIPTION){
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
	with(∆){
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

		create('collision',
			{},
			function(params){
				// setter
					for(var v in params)
						this.__proto__[v] = params[v] || 1;	
			}
		).has('movement');
	}

	Math.intRayCircle = function(circle, ray){
		// x^2 + y^2 = r^2
		// f(x, y) = (x-a)^2 + (y-b)^2 = r^2
		// f(p + d*t) = r^2
		// ((px + dx*t)-a)^2 + ((py + dy*t)-b)^2 - r^2 = 0
		// (px^2 + dx*t^2) - 2(a*px + a*dx*t) + a^2 + (py^2 + dy*t^2) - 2(b*py + b*dy*t) + b^2 - r^2 = 0
		var d = ray.dir;
		var dr = Math.sqrt(d[0] * d[0] + d[1] * d[1]);
		
	};
}();	
