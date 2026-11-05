"use client";

import dynamic from "next/dynamic";
export const DictionaryLabClient = dynamic(() => import("./DictionaryLab").then((module) => module.DictionaryLab), { ssr: false });
