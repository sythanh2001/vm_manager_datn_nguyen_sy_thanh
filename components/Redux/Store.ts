"use client";

import { configureStore } from "@reduxjs/toolkit";
import GlobalSlice from "./GlobalSlice";
export const store = configureStore({ reducer: { global: GlobalSlice } });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
