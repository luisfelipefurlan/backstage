/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import axios from 'axios';
import Config from './Config.js'
const GQL_DEVICES_LIST = `
{
  getDevices{
    totalPages,
    currentPage,
    devices{
      id
      label
      attrs {
        label
        valueType
        isDynamic
        staticValue
      }
    }
  }
}
`

export default function ReturnLogin(props) {

  const [data, setData] = useState({
    userInfo: {},
    dataExample: {},
    dataProxy: {},
    state: 'none',
    errorMsg: 'none',
  });

  // getting the parameter state e error (if it exists) in the query string
  const paramsQueryString = new URLSearchParams(props.location.search);

  const stateQueryString = paramsQueryString.get('state') || 'none';
  const errorQueryString = paramsQueryString.get('error');

  useEffect(() => {
    async function call() {
      try{
        const { data: resultUserInfo
         } = await axios.get(Config.USER_INFO_URL);
            setData({
              ...data,
              state: stateQueryString,
              userInfo: resultUserInfo,
            });
      }catch(error){
        // these are errors related to authentication and authorization
        // redirect to the homepage or do something else
        if (error.response && (error.response.status===401 || error.response.status===403)){
          setData({
            ...data,
            errorMsg: `${error.response.status}: ${JSON.stringify(error.response.data)}`,
          });
        }else{
          setData({
            ...data,
            errorMsg: error.message,
          });
        }
      }
  }
    // checks if there is an error parameter in the querystring
    if(!errorQueryString){
        call();
      } else {
        // redirect to the homepage or do something else
        setData({
          ...data,
          errorMsg: errorQueryString,
        });
      }

  },[]);

  const handleExampleData  = async (evt) => {
    try{
    const { data: resultData } = await axios.post(Config.GQL_URL, {
      query: GQL_DEVICES_LIST,
      });
      setData({
        ...data,
        dataExample: resultData,
        errorMsg:'none',
      });
    }catch(error){
        // these are errors related to authentication and authorization
        // redirect to the homepage or do something else
        if (error.response && (error.response.status===401 || error.response.status===403)){
          setData({
            ...data,
            dataExample: {},
            errorMsg: `${error.response.status}: ${JSON.stringify(error.response.data)}`,
          });
        }else{
          setData({
            ...data,
            dataExample: {},
            errorMsg: error.message,
          });
        }
      }
  }

  const handleExampleProxy  = async (evt) => {
    try{
    const { data: resultData } = await axios.post(Config.PROXY_URL+'/template', {
      "label": "Thermometer Template",
      "attrs": [
        {
          "label": "temperature",
          "type": "dynamic",
          "value_type": "float"
        },
        {
          "label": "fan",
          "type": "actuator",
          "value_type": "float"
        }
      ]
    },{
        headers: { 'content-type': 'application/json' },
        responseType: 'json'
      }
    );

      setData({
        ...data,
        dataProxy: resultData,
        errorMsg:'none',
      });
    }catch(error){
        // these are errors related to authentication and authorization
        // redirect to the homepage or do something else
        if (error.response && (error.response.status===401 || error.response.status===403)){
          setData({
            ...data,
            dataProxy: {},
            errorMsg: `${error.response.status}: ${JSON.stringify(error.response.data)}`,
          });
        }else{
          setData({
            ...data,
            dataProxy: {},
            errorMsg: error.message,
          });
        }
      }
  }

  const handleLogout  = async (evt) => {
    window.location.href = Config.LOGOUT_URL;
  }

  return (
    <div>
      <div>
          <span>User info e permissions:</span>
      </div>
      <div>
          <span>{JSON.stringify(data.userInfo)}</span>
      </div>
      <div>
        <br/>
      </div>
      <div>
        <br/>
      </div>
      <div>
        <span>State: {data.state} </span>
      </div>
      <div>
        <br/>
      </div>
      <div>
        <div>
        <button
          onClick={handleExampleData}>
          Request Devices via GraphQL
        </button>
        </div>
        <div>Data returned: {JSON.stringify(data.dataExample)}</div>
      </div>
      <div>
        <br/>
      </div>
      <div>
      <div>
      <button
        onClick={handleExampleProxy}>
        Proxy, create a template `Thermometer Template`
      </button>
      </div>
      <div>Data returned: {JSON.stringify(data.dataProxy)}</div>
    </div>
    <div>
      <br/>
    </div>
      <div>
        <span>Error message: {data.errorMsg} </span>
      </div>
      <div>
        <br/>
      </div>
      <div>
        <span> Logout? </span>
        <button
          onClick={handleLogout}>
          Yes
        </button>
      </div>
    </div>
  );
}