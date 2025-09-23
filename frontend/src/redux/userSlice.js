import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  role: null,
  userId: null,
  username: null,
  email: null,
  avatar: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action) => {
      console.log("Reducer login, payload:", action.payload); // Debug
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.userId = action.payload.userId;
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.avatar = action.payload.avatar;
    },
    logout: (state) => {
      console.log("Reducer logout"); // Debug
      state.token = null;
      state.role = null;
      state.userId = null;
      state.username = null;
      state.email = null;
      state.avatar = null;
    },
    updateUser: (state, action) => {
      console.log("Reducer updateUser, payload:", action.payload); // Debug
      state.userId = action.payload.userId;
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.avatar = action.payload.avatar;
    },
  },
});

export const { login, logout, updateUser } = userSlice.actions;
export default userSlice.reducer;
