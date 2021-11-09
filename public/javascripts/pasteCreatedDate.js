function createdDate() {
    /*var dt = new Date().toISOString().replace(/T../, ' ' + new Date().getHours()).replace(/\..+/, '');
    if (new Date().getHours() < 10) {
        dt = new Date().toISOString().replace(/T../, ' 0' + new Date().getHours()).replace(/\..+/, '');
    }
    return dt;*/
    var dt = new Date();
    dt = new Date(dt + "UTC").toISOString().replace(/T/, ' ').replace(/\..+/, '');
    return dt;
}

module.exports = {createdDate};