"use client";
import { createSlice } from "@reduxjs/toolkit";

export interface GlobalState {
  user: {
    items: { cart: string[]; wishlist: string[] };
  };
}

const initialState: GlobalState = {
  user: {
    items: {
      cart: [],
      wishlist: [],
    },
  },
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      if (state.user.items.cart.find((x) => x == action.payload)) return;
      state.user.items.cart.push(action.payload);
    },
    removeFromCart: (state, action) => {
      state.user.items.cart = state.user.items.cart.filter(
        (item) => item != action.payload
      );
    },
    addToWishlist: (state, action) => {
      if (state.user.items.wishlist.find((x) => x == action.payload)) return;
      state.user.items.wishlist.push(action.payload);
    },
    removeFromWishlist: (state, action) => {
      state.user.items.wishlist = state.user.items.wishlist.filter(
        (item) => item != action.payload
      );
    },
  },
});

export const { addToCart, removeFromCart, addToWishlist, removeFromWishlist } =
  globalSlice.actions;

export default globalSlice.reducer;
