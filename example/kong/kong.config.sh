#!/bin/sh

kong="http://apigw:8001"

# check if kong is started
if curl --output /dev/null --silent --head --fail "$kong"; then
  echo ""
  echo "Kong is started."
else
  echo "Kong isn't started."
  echo "Terminating in 20s..."
  sleep 20
  exit 1
fi

# add authentication to an endpoint
addAuthToEndpoint() {
# $1 = Service Name
echo ""
echo ""
echo "- addAuthToEndpoint: ServiceName=${1}"

curl -X POST ${kong}/services/"${1}"/plugins \
  --data "name=jwt-keycloak" \
  --data "config.allowed_iss=http://localhost:8000/auth/realms/(.*)"

curl  -sS  -X POST \
--url ${kong}/services/"${1}"/plugins/ \
--data "name=pepkong" \
--data "config.resource=${1}"

}

# add a Service
# that is the name Kong uses to refer to the upstream APIs
# and microservices it manages.
createService() {
# $1 = Service Name
# $2 = URL (ex.: http://gui:80)
echo ""
echo "-- createService: ServiceName=${1} Url=${2}"
curl  -sS -X PUT \
--url ${kong}/services/"${1}" \
--data "name=${1}" \
--data "url=${2}"
}

# add a Route
# The Route represents the actual request to the Kong proxy
# endpoint to reach at Kong service.
createRoute() {
# $1 = Service Name
# $2 = Route Name
# $3 = PATHS (ex.: '"/","/x"')
# $4 = strip_path (true or false), When matching a Route via one of the paths, strip the matching prefix from the upstream request URL
echo ""
echo "-- createRoute: ServiceName=${1} Url=${2} PathS=${3} StripPath=${4}"
(curl  ${kong}/services/"${1}"/routes/"${2}" -sS -X PUT \
    --header "Content-Type: application/json" \
    -d @- ) <<PAYLOAD
{
    "paths": [${3}],
    "strip_path": ${4}
}
PAYLOAD
}

# Create an endpoint mapping in Kong
# ex1: createEndpoint "data-broker" "http://data-broker:80"  '"/device/(.*)/latest", "/subscription"' "false"
# ex2: createEndpoint "image" "http://image-manager:5000"  '"/fw-image"' "true"
createEndpoint(){
# $1 = Service Name
# $2 = URL (ex.: "http://gui:80")
# $3 = PATHS (ex.: '"/","/x"')
# $4 = strip_path ("true" or "false"), When matching a Route via one of the paths, strip the matching prefix from the upstream request URL.
echo ""
echo ""
echo "- createEndpoint: ServiceName=${1} Url=${2} PathS=${3} StripPath=${4}"
createService "${1}" "${2}"
createRoute "${1}" "${1}_route" "${3}" "${4}"
}

createEndpoint "device-manager" "http://dojot-mock:8888"  '"/device", "/template"' "false"
addAuthToEndpoint "device-manager"

createEndpoint "history" "http://dojot-mock:8888"  '"/history"' "false"
addAuthToEndpoint "history"

createEndpoint "keycloak" "http://keycloak:8080/auth"  '"/auth"' "true"

createEndpoint "spa-example" "http://spa-example:80"  '"/"' "false"

createEndpoint "backstage" "http://backstage:3000"  '"/backstage"' "false"
