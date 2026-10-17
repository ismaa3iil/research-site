// SPDX-License-Identifier: MIT
// Exact terminating parameters are stored as integer ratios or rational strings.
// Browser coordinates approximate the maps whose certificates are linked in the guide.
export const ANALYTIC_HEARTS_DATE='17 October 2026';
export const FIRST_SHAPE_MAPS=[
  {id:'S1',seed:['2/5','6/5','-3/2','5/2'],lower:'1',name:'Simple shape-dependent map S1'},
  {id:'S2',seed:['2/5','1','-3/2','14/5'],lower:'1',name:'Auxiliary shape-dependent map S2'},
  {id:'S3',seed:['3/8','1','-7/5','5/2'],lower:'1',name:'Auxiliary shape-dependent map S3'},
  {id:'S*',seed:['2/5','6/5','-3/2','5/2'],lower:'10478284289/10000000000',upper:'1047828429/1000000000',name:'First shape ray · certified lower endpoint'}
];
export const INDEPENDENT_RAYS=[
  {id:'R1',seed:['-3/4','49/20','29/20','-53/20'],lower:'99895956/100000000',upper:'99895959/100000000',witness:[6,5,3]},
  {id:'R2',seed:['3/4','23/10','-1','6/5'],lower:'98667546/100000000',upper:'98667549/100000000',witness:[6,5,3]},
  {id:'R3',seed:['3/4','-21/4','3/4','-27/20'],lower:'98083518/100000000',upper:'98083521/100000000',witness:[9,8,7]},
  {id:'R4',seed:['-19/20','6/5','3/4','-33/20'],lower:'100950335/100000000',upper:'100950338/100000000',witness:[9,6,5]},
  {id:'R5',seed:['9/20','6/5','-8/5','13/5'],lower:'97654994/100000000',upper:'97654997/100000000',witness:[6,5,3]},
  {id:'R6',seed:['3/4','-17/4','-9/5','41/5'],lower:'97871127/100000000',upper:'97871130/100000000',witness:[9,8,7]}
];
// Rational inward bounds: every sampled arc parameter belongs to the proved interval.
export const CONSTANT_ARC_BOUNDS={I:['649110640674/1000000000000','1040157923221/1000000000000'],II:['271686050621/1000000000000','386458326894/1000000000000']};
export const EXTENSION_RAYS=[
  {id:'R7',seed:['3/5','0','0','-29/20','2','0'],lower:'94423179/100000000',upper:'94423182/100000000'},
  {id:'R8',seed:['1','4/3','0','-1/2','-7/10','0'],lower:'99579960/100000000',upper:'99579963/100000000'},
  {id:'R9',seed:['0','-12/5','0','8/5','-9/2','0'],lower:'91081582/100000000',upper:'91081585/100000000'},
  {id:'R10',seed:['1/2','-7/5','0','-2','9','0'],lower:'96617699/100000000',upper:'96617702/100000000'},
  {id:'P1',seed:['3/5','1/10','-3/5','-8/5','3','7/10'],lower:'101367358/100000000',upper:'101367361/100000000'},
  {id:'P2',seed:['1/5','-14/5','1/5','13/10','-7/5','-1/5'],lower:'95069548/100000000',upper:'95069551/100000000'},
  {id:'P3',seed:['4/5','11/5','-1/5','-4/5','-4/5','2/5'],lower:'99773390/100000000',upper:'99773393/100000000'}
];
export const EXACT_COLLINEAR_ENDPOINTS=[
  {id:'R2*',name:'R2* · exact attractive radial endpoint',seed:['3/4','23/10','-1','6/5'],lower:'8960/9081'},
  {id:'R5*',name:'R5* · exact attractive radial endpoint',seed:['9/20','6/5','-8/5','13/5'],lower:'3040/3113'}
];
export function rational(value){const [n,d='1']=String(value).split('/');return Number(n)/Number(d);}
