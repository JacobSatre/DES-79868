$(document).ready(function() {

    //retrieve and cache submit button href value
    let overrideList = $('.qfilter-override');
    let submitList = $('.qfilter-submit');
    let hrefList = [];
    for (let i = 0; i < submitList.length; i++) {
        hrefList.push(submitList[i].getAttribute('href'));
    }

    //retrieve category filter count elements
    let categoryCount = $('.qfilter-categorycount');

    let optionList = $('.qfilter-option');

    //categories
    let type = { filterName: "Type", filterValues: [] };
    let year = { filterName: "Year", filterValues: [] };
    let model = { filterName: "Model", filterValues: [] };
    let make = { filterName: "Make", filterValues: [] };
    let bodystyle = { filterName: "Bodystyle", filterValues: [] };
    let fueltype = { filterName: "Fueltype", filterValues: [] };
    let extcolor = { filterName: "ExtColor", filterValues: [] };
    let mpgcity = { filterName: "CityMpgrange", filterValues: [] };
    let mpghighway = { filterName: "HwyMpgrange", filterValues: [] };
    let transmission = { filterName: "Transmission", filterValues: [] };
    let features = { filterName: "Features", filterValues: [] };
    let pricerange = { filterName: "Pricerange", filterValues: [] };
    let cylinders = { filterName: "Cylinders", filterValues: [] };
    let drivetraintype = { filterName: "DriveTrainType", filterValues: [] };
    let cpo = { filterName: "cpo", filterValues: [] };
    let carfax1owner = { filterName: "carfax1owner", filterValues: [] };
    let special = { filterName: "special", filterValues: [] };

    //categories list
    const categories = [type, year, model, make, bodystyle, fueltype, extcolor, mpgcity, mpghighway, transmission, features, pricerange, cylinders, drivetraintype, cpo, carfax1owner, special];

    //manages options/filters
    function sortFilter(option) {

        //interate through each category
        for (let i = 0; i < categories.length; i++) {
            if (option.dataset.filter.toUpperCase() == categories[i].filterName.toUpperCase()) {

                //if category doesn't include option, add it
                console.log(option.dataset.value);

                if (categories[i].filterValues.includes(option.dataset.value) == false) {
                    categories[i].filterValues.push(option.dataset.value);

                    //update page elements
                    addCurrentFilter(option.dataset.value, $(option).text(), categories[i].filterName, categories[i].filterValues.length);
                    updateCategoryCount(categories[i].filterName, categories[i].filterValues.length);


                    //if category includes option, find and remove it
                } else {
                    for (let n = 0; n < categories[i].filterValues.length; n++) {
                        if (categories[i].filterValues[n] == option.dataset.value) {
                            categories[i].filterValues.splice(n, 1);

                            //update page elements
                            removeCurrentFilter($(option).text(), categories[i].filterName, categories[i].filterValues.length);
                            updateCategoryCount(categories[i].filterName, categories[i].filterValues.length);
                        }
                    }
                }
            }
        }
    }

    //builds query string
    function buildQuery() {
        let queryString = "";
        let beginBuild = false;

        //interate through each category
        for (let i = 0; i < categories.length; i++) {
            if (categories[i].filterValues.length > 0) {

                //place correct character between categories
                if (beginBuild == false) {
                    queryString += "?";
                    beginBuild = true;
                } else {
                    queryString += "&";
                }

                //compile filter values
                let filterValues = "";
                let beginCount = false;
                for (let n = 0; n < categories[i].filterValues.length; n++) {
                    if (beginCount == true) {
                        filterValues += ",";
                    }
                    filterValues += categories[i].filterValues[n];
                    beginCount = true;
                }

                //add category name and filter values to querystring
                queryString += categories[i].filterName + "=" + filterValues;
            }
        }

        //encode URL
        queryString = encodeURI(queryString);

        //update submit button href
        for (let i = 0; i < submitList.length; i++) {
            $(submitList[i]).attr('href', hrefList[i] + queryString);

        }
    }

    //Adds current selections to the page as DOM elements
    function addCurrentFilter(name, value, category, categoryLength) {

        //define element ids
        let valueid = "qfilter-current" + "-" + category + "-" + encodeURIComponent(value);
        let categoryid = "qfilter-current" + "-" + category;

        //category (parent element)
        let categoryelement = document.createElement("p");

        //add ids and classes
        categoryelement.setAttribute('id', categoryid);
        categoryelement.setAttribute('class', 'qfilter-current-category')

        //label (child element)
        let labelelement = document.createElement("span");
        let labelcontent = document.createTextNode(category + ":");

        //add ids and classes
        labelelement.setAttribute('class', 'qfilter-current-label');
        labelelement.appendChild(labelcontent);

        //value (child element)
        let valueelement = document.createElement("span");
        let valuecontent = document.createTextNode(value + "");

        //add ids and classes
        valueelement.setAttribute('id', valueid);
        valueelement.setAttribute('class', 'qfilter-current-value');
        valueelement.setAttribute('data-filter', category);
        valueelement.setAttribute('data-value', name);
        valueelement.appendChild(valuecontent);
        valueelement.addEventListener("click", function() { cancelCurrentFilter(this) });

        //add correct elements
        if (categoryLength == 1) {
            document.getElementById('qfilter-current').appendChild(categoryelement);
            categoryelement.appendChild(labelelement);
            categoryelement.appendChild(valueelement);
        } else {
            document.getElementById(categoryid).appendChild(valueelement);
        }
    }

    ////Removes current selections DOM elements from page
    function removeCurrentFilter(value, category, categoryLength) {

        //define element ids
        let valueid = "qfilter-current" + "-" + category + "-" + encodeURIComponent(value);
        let categoryid = "qfilter-current" + "-" + category;

        //category (parent element)
        let categoryelement = document.getElementById(categoryid);

        //value (child element)
        let valueelement = document.getElementById(valueid);
        valueelement.removeEventListener("click", function() { cancelCurrentFilter(this) });

        //remove correct elements
        if (categoryLength == 0) {
            categoryelement.remove();
        } else {
            valueelement.remove();
        }
    }

    //click to remove current filters 
    function cancelCurrentFilter(option) {
        let value = option.dataset.value;
        let filter = option.dataset.filter;
        for (let i = 0; i < optionList.length; i++) {
            if (optionList[i].dataset.value.toUpperCase() == value.toUpperCase() && optionList[i].dataset.filter.toUpperCase() == filter.toUpperCase()) {
                $(optionList[i]).removeClass('qfilter-selected');
            }
        }
        sortFilter(option);
        buildQuery();
    }

    //updates category count element
    function updateCategoryCount(category, categoryLength) {
        for (let i = 0; i < categoryCount.length; i++) {
            if (categoryCount[i].dataset.filter.toUpperCase() == category.toUpperCase()) {
                if (categoryLength > 0) {
                    $(categoryCount[i]).text('(' + categoryLength + ')')
                } else {
                    $(categoryCount[i]).text('');
                }
            }
        }
    }

    //gather overrides
    for (let i = 0; i < overrideList.length; i++) {
        sortFilter(overrideList[i]);
        buildQuery();
    }

    //onclick
    $('.qfilter-option').click(function() {
        $(this).toggleClass('qfilter-selected');
        sortFilter(this);
        buildQuery();
    });
});
