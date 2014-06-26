var extend = require('js-extend').extend,
path = require('path'),
jsts = require('jsts'),
Dbf = require('idbf').Dbf;


var CallbackContext = require('./CallbackContext'),
Qix = require('./Qix'),
Shp = require('./Shp'),
Shx = require('./Shx');


var INTERSECTS_OPTIONS = {
	data: true, geometry: true
};

// TODO: JSTS Geometry Factory pool?

var JSTS_FACTORY = new jsts.geom.GeometryFactory();

function ShapeFile(fileName) {
	this._baseName = path.join(path.dirname(fileName), path.basename(fileName, '.shp'));
}


ShapeFile.prototype.intersects = function(geometry, options, callback) {

	if (!callback) {
		callback = options;
		options = INTERSECTS_OPTIONS;
	} else {
		options = extend({}, INTERSECTS_OPTIONS, options);
	}


	var envelope = geometry.getEnvelopeInternal();

	var callBackContext = new CallbackContext(callback);

	var dbf, shp = this.shp();

	if (options.data)
		dbf = this.dbf();

	var intersects = function(err, shpGeometry, index) {
		if (err)
			callBackContext.error(err);
		else {
			//console.log('shpGeometry = %s', shpGeometry);
			if (geometry.intersects(shpGeometry))
				callback(null, shpGeometry);
		}
	};

	this.qix().query(envelope, function(err, index) {
		if (err)
			callBackContext.error(err);
		else
			shp.get(index, intersects);
	});

};


ShapeFile.prototype.dbf = function() {
	if (!this._dbf)
		this._dbf = new Dbf(this._baseName + '.dbf');

	return this._dbf;
};

ShapeFile.prototype.qix = function() {

	if (!this._qix)
		this._qix = new Qix(this._baseName + '.qix');
	return this._qix;
};

ShapeFile.prototype.shp = function() {
	if (!this._shp)
		this._shp = new Shp(this._baseName + '.shp', this.shx(), JSTS_FACTORY);

	return this._shp;
};

ShapeFile.prototype.shx = function() {
	if (!this._shx)
		this._shx = new Shx(this._baseName + '.shx');

	return this._shx;
};

module.exports = ShapeFile;