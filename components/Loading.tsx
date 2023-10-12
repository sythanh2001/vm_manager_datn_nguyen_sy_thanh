"use client";
import * as React from "react";
import { Hypnosis } from "react-cssfx-loading";

export interface IDefaultLoadingProps {}

export function DefaultLoading({}: IDefaultLoadingProps) {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <Hypnosis height={100} width={100}></Hypnosis>
    </div>
  );
}
