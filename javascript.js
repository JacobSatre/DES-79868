//retrieve and cache submit button href value
let overrideList = $('.qfilter-override');
let submitList = $('.qfilter-submit');
let hrefList = [];
for (let i = 0; i < submitList.length; i++) {
	hrefList.push(submitList[i].getAttribute('href'));
}

//retrieve category filter count elements
let filterCount = $('.qfilter-filtercount');

//categories
let type = {filterName:"Type",filterValues:[]};
let year = {filterName:"Year",filterValues:[]};
let model = {filterName:"Model",filterValues:[]};
let make = {filterName:"Make",filterValues:[]};
let bodystyle = {filterName:"Bodystyle",filterValues:[]};
let fueltype = {filterName:"Fueltype",filterValues:[]};
let extcolor = {filterName:"ExtColor",filterValues:[]};
let mpgcity = {filterName:"CityMpgrange",filterValues:[]};
let mpghighway = {filterName:"HwyMpgrange",filterValues:[]};
let transmission = {filterName:"Transmission",filterValues:[]};
let features = {filterName:"Features",filterValues:[]};
let pricerange = {filterName:"Pricerange",filterValues:[]};
let cylinders = {filterName:"Cylinders",filterValues:[]};
let drivetraintype = {filterName:"DriveTrainType",filterValues:[]};
let cpo = {filterName:"cpo",filterValues:[]};
let carfax1owner = {filterName:"carfax1owner",filterValues:[]};
let special = {filterName:"special",filterValues:[]};

//categories list
const categories = [type,year,model,make,bodystyle,fueltype,extcolor,mpgcity,mpghighway,transmission,features,pricerange,cylinders,drivetraintype,cpo,carfax1owner,special];

//manages options/filters
function sortFilter(option) {

	//interate through each category
	for (let i = 0; i < categories.length; i++) {
		if (option.dataset.filter.toUpperCase() == categories[i].filterName.toUpperCase()) {

			//if category doesn't include option, add it
			if (categories[i].filterValues.includes(option) == false) {
				categories[i].filterValues.push(option);

			//if category includes option, find and remove it
			} else {
				for (let n = 0; n < categories[i].filterValues.length; n++) {
					if (categories[i].filterValues[n] == option) {
						categories[i].filterValues.splice(n,1);
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
			filterValues = "";
			beginCount = false;
			for (let n = 0; n < categories[i].filterValues.length; n++) {
				if (beginCount == true) {
					filterValues += ",";
				}
				filterValues += categories[i].filterValues[n].dataset.value;
				beginCount = true;
			}

			//add category name and filter values to querystring
			queryString += categories[i].filterName+ "=" + filterValues;
		}
	}

	updateFilterCount();

	//encode URL
	queryString = encodeURI(queryString);

	//update submit button href
	for (let i = 0; i < submitList.length; i++) {
		$(submitList[i]).attr('href',hrefList[i] + queryString);

	}
}

//updates category count of corresponding data-filter
function updateFilterCount() {
    for (let k = 0; k < filterCount.length; k++) {
        for (let j = 0; j < categories.length; j++) {
            if (filterCount[k].dataset.filter.toUpperCase() == categories[j].filterName.toUpperCase()) {
            	if (categories[j].filterValues.length > 0) {
            		$(filterCount[k]).text('('+ categories[j].filterValues.length +')');
            	} else {
            		$(filterCount[k]).text('');
            	} 
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
$('.qfilter-option').click(function(){
    $(this).toggleClass('qfilter-selected');
    sortFilter(this);
    buildQuery();
});
