import React, { useState } from "react";
import Config from './Config.js'

export default function RedirectLogin() {

  const [tenant, setTenant] = useState('admin');

  // this value will be returned upon return from the login,
  // it can be useful to identify something,
  // with what page the user was on for example.
  const state = 'login-gui-state';

  const handleRedirectLogin = async (evt) => {
    window.location.href = Config.LOGIN_URL+'?tenant='+tenant+'&state='+state;
  }

  return (
    <div>
      <label>
      Tenant/Realm:
          <input
            type="text"
            value={tenant}
            onChange={e => setTenant(e.target.value)}
          />
      </label>
      <div>
      <button
        onClick={handleRedirectLogin}>
        Go to login page
      </button>
      </div>
    </div>
  );
}

