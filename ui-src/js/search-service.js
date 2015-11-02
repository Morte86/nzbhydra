angular
    .module('nzbhydraApp')
    .factory('SearchService', SearchService);

function SearchService($http) {


    var lastExecutedQuery;

    var service = {search: search, loadMore: loadMore};
    return service;

    function search(category, query, imdbid, title, rid, tvdbid, season, episode, minsize, maxsize, minage, maxage, selectedIndexers) {
        console.log("Category: " + category);
        var uri;
        if (category.indexOf("Movies") > -1 || (category.indexOf("20") == 0)) {
            console.log("Search for movies");
            uri = new URI("internalapi/moviesearch");
            if (imdbid) {
                console.log("moviesearch per imdbid");
                uri.addQuery("imdbid", imdbid);
                uri.addQuery("title", title);
            } else {
                console.log("moviesearch per query");
                uri.addQuery("query", query);
            }

        } else if (category.indexOf("TV") > -1 || (category.indexOf("50") == 0)) {
            console.log("Search for shows");
            uri = new URI("internalapi/tvsearch");
            if (tvdbid) {
                uri.addQuery("tvdbid", tvdbid);
                uri.addQuery("title", title);
            }
            if (rid) {
                uri.addQuery("rid", rid);
                uri.addQuery("title", title);
            }

            if (season != "") {
                uri.addQuery("season", season);
            }
            if (episode != "") {
                uri.addQuery("episode", episode);
            }
        } else {
            console.log("Search for all");
            uri = new URI("internalapi/search");
            uri.addQuery("query", query);
        }

        if (!_.isNullOrEmpty(minsize)) {
            uri.addQuery("minsize", minsize);
        }
        if (!_.isNullOrEmpty(maxsize)) {
            uri.addQuery("maxsize", maxsize);
        }
        if (!_.isNullOrEmpty(minage)) {
            uri.addQuery("minage", minage);
        }
        if (!_.isNullOrEmpty(maxage)) {
            uri.addQuery("maxage", maxage);
        }
        

        uri.addQuery("category", category);

        console.log("Calling " + uri);
        lastExecutedQuery = uri;
        return $http.get(uri).then(processData);

    }

    function loadMore(offset) {
        lastExecutedQuery.removeQuery("offset");
        lastExecutedQuery.addQuery("offset", offset);

        console.log("Calling " + lastExecutedQuery);
        return $http.get(lastExecutedQuery).then(processData);
    }

    function processData(response) {
        var results = response.data.results;
        var indexersearches = response.data.indexersearches;
        var total = response.data.total;
        var resultsCount = results.length;


        //Sum up response times of indexers from individual api accesses
        //TODO: Move this to search result controller because we need to update it every time we loaded more results
        _.each(indexersearches, function (ps) {
            ps.averageResponseTime = _.reduce(ps.api_accesses, function (memo, rp) {
                return memo + rp.response_time;
            }, 0);
            ps.averageResponseTime = ps.averageResponseTime / ps.api_accesses.length;
        });
        

        return {"results": results, "indexersearches": indexersearches, "total": total, "resultsCount": resultsCount}
    }
}

_.mixin({
    isNullOrEmpty: function (string) {
        return (_.isUndefined(string) || _.isNull(string) || string.trim().length === 0)
    }
});