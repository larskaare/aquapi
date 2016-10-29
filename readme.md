# Home of the AQUAPI project #

Yet another fun playground IOT project where the aim is to explore the RaspberryPI with a TFT hat, camera and other stuff as well as work with a few sensor connected to a Arduino UNO. Sensor data - and other stuff - will be sent to the cloud for processing. Exploring cloud services such as storage, analytics, realtime messaging ... and where ever the force leads us.

The project work as following:
* The tft hat on the rpi displays informations from the sensors in- and outside the aquarium
* The background picture of the tft hat is the latest shot from the onboard camera
* The onboard camera is triggerd by fish's (and other marine life) breaking the laser beam. 
  * Camera pictures as using on tft hat as well as loaded up to a S# bucket on AWS
  * The camera have various trottle functions avoiding it to go bananas. These are configurable
* Sensordata are send on regular, configurable intervals, up to the Elasticsearch service on AWS. Here they can be displayed and analysed using Kibana

## The hardware set-up ##
### Raspberry PI ###
* RPI v3 using on-board camera
* 2.2 PiTTF hat from Adafruit

### Arduino Uno ###
* DS18B20 for water temperature
* BME280 for air temp, pressure, humidity
* Photoresistor
* Laser diode
* TSL2561 for external light
* Funduino water sensor
  
## The software setup ##
* Raspian Jessie
* Nodejs
* Johnny-five
* Raspistill for taking snapshots
* Imagemagick to resize snapshots

## Cloud ##
* Amazon AWS S3 for image storage
* Amazon Elasticsearch services for sensordata stoage and analysis


## Set-up & get-going ##

To get started (Hardware)
* Get the rpi 3 up and running using rasberian Jessie or newer (i guess) with raspistill and Imagemagick
* Put the Adafruit 2.2 tft hat on top of the rpi3
* Connect the rpi to the Arduino board using an usb cable
* Make sure that the Arduino has installed the Standard Firmate software
* On the arduino wire-up sensors
  * TSL2561 and BME280 are using the i2c bus. Remember to provide them with 3.3v power, not 5v.
  * The laser diode is using a digial port
  * The photoresistor is using an analog port. The camera function will be triggered by breaking the laser beam. The length of the wires will depend on your set-up 
  * The DS18B20 is using a digial port (amongst others)
  * The Funduino Watersensor is using an analog port
* On the rpi connect the camera to the on-board port. Having a flex cabel of 1m+ will be a good idea :)

To get started (Software)
* Clone the project from github
* Go to the aquapi project and do a "npm install"
* Alter the config/config.json to your preferences and set-up
* I recommend using the setup/aquapi_env for storing aws secrets (not using the condfig file)
* Use the setup/elastic_setup.sh to create the elasticsearch index for holding the sensor data. Rememver environment variables fron setup/aquapia_env.
* Start with "npm start"
* use grunt watch (and other tasks to lint, beautify++)

## config.json ##
Description for some of the most important configurable features

* SensorSamplingRate: How often we will sample sensors on the arduino (ms)
* SendSensorRate: How often we will send sensordata to aws (ms)
* LaserMotionThreshold: The light level on the photoresistor indicating a broken laser beam
* SnapshotThrottleTime: How long do we wait before taking another snapshot (ms)
