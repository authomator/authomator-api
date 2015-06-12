/**
 * Schema plugin to add transform functions to the schema
 * currently a 'hide' function is present on toJSON
 *
 * @param {mongoose.Schema} schema -
 */

module.exports = exports = function transformPlugin(schema) {


    var transform  = function (doc, ret, options) {

        if (options.hide) {

            // loop over all the hide entries
            options.hide.split(' ').forEach(function (prop) {

                // if an entry has '.' go in deeper
                if ( prop.indexOf('.') !== -1 ) {

                    var pointer = ret;
                    var path = prop.split('.');
                    var pathsFound = 0;

                    path.forEach(function(idx){
                        if ( 'object' == typeof pointer && pointer.hasOwnProperty(idx) ) {
                            pathsFound++;
                            if (pathsFound === path.length) {
                                delete pointer[idx]
                            }else {
                                pointer = pointer[idx];
                            }
                        }
                    });

                } else {
                    delete ret[prop];
                }
            });
        }
    };

    if (! schema.options.toJSON) schema.options.toJSON = {};
    schema.options.toJSON.transform = transform;

}





