import { Component, OnInit } from '@angular/core'
import { FormGroup, FormControl } from '@angular/forms'
import { environment } from '../../environments/environment'

@Component({
  selector: 'app-charlie-weather',
  templateUrl: './charlie-weather.component.html',
  styleUrls: ['./charlie-weather.component.css']
})
export class CharlieWeatherComponent implements OnInit {

	/**
	 * Creation of a FormControl, to better manipulate
	 * its values when needed.
	 */
	cityInputForm = new FormGroup({
        cityInput: new FormControl('')
    });

	// Weather API related variables
	weatherInfo!: {
		wind_speed: number,
		humidity: number,
		pressure: number
	};
	temperatureTodayC!: number;
	temperatureTomorrowC!: number;
	temperatureDayAfterTomorrowC!: number;
	temperatureTodayF!: number;
	temperatureTomorrowF!: number;
	temperatureDayAfterTomorrowF!: number;
	temperatureUnit: boolean = false
	weatherType!: string;

	// Holds possible cities from a query
	possibleCities!: [{
		formatted: string
	}];

	// Booleans to identify searches
	showSearchResults: boolean = false;
	isQueryResults!: boolean;

	// Pass the url so we can style in css
	showBackgroundImage!: string;

	// Loading flag
	loading!: boolean;

	/**
	 * Holds the hue value, to dynamically change
	 * the color based on temperature value 
	 */ 
	color!: string;

	// Holds api key
	apiWeather!: string
	apiLocation!: string

    get cityInput() { return this.cityInputForm.get('cityInput'); }

	constructor() {
		this.apiWeather = environment.API_WEATHER
		this.apiLocation = environment.API_LOCATION
	}

	ngOnInit(): void{
		this.cityInputSubscription()
		this.getInitLocation()
		this.getBackgroundImageContent()
	}

	/**
	 * Listen to changes made on input value. Every change
	 * it fires the location API to show it to the user.
	 */
	cityInputSubscription() {
		this.cityInput?.valueChanges.subscribe( (async (data) => {
			await this.getForwardLocation(data)
			this.showSearchResults = true

			if(data === ''){
				this.showSearchResults = false
			}
		}))
	}

	/**
	 * Gets the background image from Bing API
	 */
	async getBackgroundImageContent() {
		try {
			let corsAccess = 'https://thingproxy.freeboard.io/fetch/'
			const response = await fetch(`${corsAccess}https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=pt-BR`)
			
			const data = await response.json()
			this.showBackgroundImage = `url('https://www.bing.com/${data.images[0].url}')`
		} catch (error) {
			console.log(error)
		}
	}

	/**
	 * Gets the current location from the user's browser
	 * through it's native API.
	 */
	getInitLocation(){
		if (navigator.geolocation) {
			this.loading = true
			navigator.geolocation.getCurrentPosition((position) => {
				const initLat = position.coords.latitude
				const initLon = position.coords.longitude
				this.getReverseLocation(initLat, initLon)
			});
		} else {
			this.loading = false
			alert("No support for geolocation, please enter your location manually")
		}
	}

	/**
	 * Gets the weather based on latitude and longitude. Units are in metric system.
	 */
	async getWeather(lat: number, lon: number) {
		try {
			const response = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=hourly,minutely,alerts&units=metric&lang=pt_br&appid=${this.apiWeather}`)
			const data = await response.json()

			this.temperatureTodayC = Math.round(data.daily[0].temp.day)
			this.temperatureTomorrowC = Math.round(data.daily[1].temp.day)
			this.temperatureDayAfterTomorrowC = Math.round(data.daily[2].temp.day)

			this.weatherInfo = data.daily[0]
			this.weatherType = (data.daily[0].weather[0].main)

			this.loading = false
		} catch (error) {
			console.log(error)
		}
	}

	/**
	 * Calculates the color relative to the number of degrees in celsius.
	 * It's a linear function that correlates both values, so it's lighter and
	 * darker given a temperature.
	 */
	colorCalculation(temperature: number){
		/**
		 * f(x) = 2.66x + 200 - blue
		 * f(x) = -2.5x + 100 - yellow to red
		 */
		let a!: number;
		let b!: number;
		if (temperature > 15) {
			a = -2.5
			b = 100
		} else {
			a = 2.66
			b = 200
		}
		
		let linFunction = (a * temperature + b)
		return `hsl(${linFunction }, 75%, 50%)`
	}

	/**
	 * Simple function to converto from celsius to fahrenheit. Changing it
	 * manually prevents from calling the api again, preserving our resources
	 */
	changeTempUnit() {
		this.temperatureUnit = !this.temperatureUnit
		this.temperatureTodayF = Math.round(this.temperatureTodayC * 1.8 + 32)
		this.temperatureTomorrowF = Math.round(this.temperatureTomorrowC * 1.8 + 32)
		this.temperatureDayAfterTomorrowF = Math.round(this.temperatureDayAfterTomorrowC * 1.8 + 32)
	}

	/**
	 * Given a location, fetches an API to collect and return its latitude and longitude.
	 */
	async getForwardLocation(cityName: string): Promise<{ lat: number; lon: number;} | undefined>{
		try {
			const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${cityName}&key=${this.apiLocation}`)
	
			const data = await response.json()
			
			if (data.results.length == 0){
				/**
				 * If the query returns empty, we don't
				 * want to continue in the function.
				 */
				this.isQueryResults = false
				return
			} 
			this.possibleCities = data.results;
			this.isQueryResults = true
			
			return {
				lat: data.results[0].geometry.lat,
				lon: data.results[0].geometry.lng
			}
		} catch (error) {
			console.log(error)
			return
		}
	}

	/**
	 * Given a latitude and longitude, fetches an API to collect and return its location.
	 */
	async getReverseLocation(initLat: number, initLon: number){
		try {
			const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${initLat}+${initLon}&key=${this.apiLocation}`)

			const data = await response.json()

			/**
			 * Here we're not emitting an event to the subscribe
			 * beacause it wasn't the user who made the change
			 */
			this.cityInput?.setValue(data.results[0].formatted, {emitEvent: false})
			this.getWeather(initLat, initLon)

		} catch (error) {
			console.error(error)
		}
	}

	/**
	 * Receives a location name. Will fetch it's latitude and longitude and with that
	 * will fetch it's weather.
	 */
	async citySelection(city: string) {
		this.loading = true

		/**
		 * Here we're not emitting an event to the subscribe
		 * beacause it wasn't the user who made the change
		 */
		this.cityInput?.setValue(city, {emitEvent: false})
		this.showSearchResults = false

		const coords = await this.getForwardLocation(city)
		if (coords){
			this.getWeather(coords?.lat, coords?.lon)
		}
	}
}
