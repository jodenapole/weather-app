import { Component, OnInit } from '@angular/core'
import { FormGroup, FormControl } from '@angular/forms'

@Component({
  selector: 'app-charlie-weather',
  templateUrl: './charlie-weather.component.html',
  styleUrls: ['./charlie-weather.component.css']
})
export class CharlieWeatherComponent implements OnInit {


	cityInputForm = new FormGroup({
        cityInput: new FormControl('')
    });

	weatherInfo!: any;
	possibleCities!: any[];
	showSearchResults: boolean = false;
	showBackgroundImage!: any;
	isQueryResults!: boolean;
	loading!: boolean;
	temperatureTodayC!: number;
	temperatureTomorrowC!: number;
	temperatureDayAfterTomorrowC!: number;
	temperatureTodayF!: number;
	temperatureTomorrowF!: number;
	temperatureDayAfterTomorrowF!: number;
	temperatureUnit: boolean = false
	weatherType!: string;
	color!: string;

    get cityInput() { return this.cityInputForm.get('cityInput'); }

	constructor() {
	}

	ngOnInit(): void{
		// this.getBackgroundImageContent()
		this.cityInputSubscription()
		this.getInitLocation()
	}

	cityInputSubscription() {
		this.cityInput?.valueChanges.subscribe( (async (data) => {
			await this.getForwardLocation(data)
			this.showSearchResults = true

			if(data === ''){
				this.showSearchResults = false
			}
		}))
	}

	async getBackgroundImageContent() {
		try {
			// let corsAccess = 'https://cors-anywhere.herokuapp.com'	
			const response = await fetch(`/https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=pt-BR`)
			
			
			const data = await response.json()
			console.log('data bing: ', data)
			// this.showBackgroundImage = true
			// this.showBackgroundImage = `url('https://www.bing.com/${data.images[0].url}')`
		} catch (error) {
			console.log(error)
		}
	}

	getInitLocation(){
		if (navigator.geolocation) {
			this.loading = true
			navigator.geolocation.getCurrentPosition((position) => {
				const initLat = position.coords.latitude
				const initLon = position.coords.longitude
				this.getReverseLocation(initLat, initLon)
			});
		} else {
			alert("No support for geolocation, please enter your location manually")
		}
	}

	async getWeather(lat: number, lon: number) {
		// http://openweathermap.org/img/wn/10d@2x.png
		let apikey = '7ba73e0eb8efe773ed08bfd0627f07b8'
		try {
			const response = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=hourly,minutely,alerts&units=metric&lang=pt_br&appid=${apikey}`)
			const data = await response.json()

			this.temperatureTodayC = Math.round(data.daily[0].temp.day)
			this.temperatureTomorrowC = Math.round(data.daily[1].temp.day)
			this.temperatureDayAfterTomorrowC = Math.round(data.daily[2].temp.day)

			this.weatherInfo = data
			this.weatherType = (data.daily[0].weather[0].main)
			// this.colorCalculation()

			this.loading = false
		} catch (error) {
			console.log(error)
		}
	}

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
			// return `hsl(${linFunction < 0 ? 0 : linFunction }, 75%, 50%)`
		} else {
			a = 2.66
			b = 200
			// return `hsl(${linFunction < 180 ? 180 : linFunction }, 75%, 50%)`
		}
		
		let linFunction = (a * temperature + b)
		return `hsl(${linFunction }, 75%, 50%)`
	}

	changeTempUnit() {
		this.temperatureUnit = !this.temperatureUnit
		this.temperatureTodayF = Math.round(this.temperatureTodayC * 1.8 + 32)
		this.temperatureTomorrowF = Math.round(this.temperatureTomorrowC * 1.8 + 32)
		this.temperatureDayAfterTomorrowF = Math.round(this.temperatureDayAfterTomorrowC * 1.8 + 32)
	}

	async getForwardLocation(cityName: string): Promise<{ lat: number; lon: number;} | undefined>{
		let apikey = 'c63386b4f77e46de817bdf94f552cddf'
	
		try {
			const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${cityName}&key=${apikey}`)
	
			const data = await response.json()
			
			if (data.results.length == 0){
				this.isQueryResults = false
				return
			} 
			this.possibleCities = data.results;
			this.isQueryResults = true
			console.log('data forward location', data)
			
			return {
				lat: data.results[0].geometry.lat,
				lon: data.results[0].geometry.lng
			}
		} catch (error) {
			console.log(error)
			return
		}
	}

	async getReverseLocation(initLat: number, initLon: number){
		try {
			let apikey = 'c63386b4f77e46de817bdf94f552cddf'
			const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${initLat}+${initLon}&key=${apikey}`)

			const data = await response.json()
			this.cityInput?.setValue(data.results[0].formatted, {emitEvent: false})
			this.getWeather(initLat, initLon)

		} catch (error) {
			console.error(error)
		}
	}

	async citySelection(city: string) {
		this.loading = true
		this.cityInput?.setValue(city, {emitEvent: false})
		this.showSearchResults = false

		const coords = await this.getForwardLocation(city)
		if (coords){
			this.getWeather(coords?.lat, coords?.lon)
		}
	}
}
