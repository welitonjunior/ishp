/*
	0: 'null',
	1: 'point',
	3: 'polyLine',
	5: 'polygon',
	8: 'multiPoint',
	25: 'polygonM'
*/

var BReader = require('./BReader');
var jsts = require('jsts');

function mkEnvelope(buffer, offset) {
	return new jsts.geom.Envelope(
		buffer.readDoubleLE(offset),
		buffer.readDoubleLE(offset + 16),
		buffer.readDoubleLE(offset + 8),
		buffer.readDoubleLE(offset + 24)
	);
}

function polylineXY(buffer, fn) {

	var numParts = buffer.readInt32LE(36),
	numPoints = buffer.readInt32LE(40);

	// TODO: check numParts and numPoints

	var partsIndexes = BReader.LE.arrayInt32(buffer, 44, numParts);
	partsIndexes.shift(); // always 0

	var x,y, line = [];

	for(var i=0, offset = 44 + 4 * numParts; i<numPoints; i++, offset += 8) {
		if (i === partsIndexes[0]) {
			fn(line);
			line = [];
			partsIndexes.shift();
		}

		x = buffer.readDoubleLE(offset);
		y = buffer.readDoubleLE(offset += 8);

		line.push(new jsts.geom.Coordinate(x, y));
	}

	fn(line);
}

module.exports = {

	5: function polygon(buffer, jstsFactory) {
		var lines = [];
		polylineXY(buffer, function(line) {
			lines.push(jstsFactory.createLineString(line));
		});

		var multiLineString = new jsts.geom.MultiLineString(lines, jstsFactory);
		multiLineString.envelope = mkEnvelope(buffer, 4);

		return multiLineString;
	}

};