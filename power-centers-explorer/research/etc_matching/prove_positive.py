"""Exact positive-coefficient sufficient test for polynomial ETC responses.
Ismail Hammoudeh; extensive ChatGPT use. Standard library only.
Mixed coefficients mean inconclusive, not a failure.
"""
from pathlib import Path
from fractions import Fraction as F
from collections import defaultdict
import json,sys
ROOT=Path(__file__).resolve().parents[2]
ASSET=ROOT/'explorer/data' if (ROOT/'explorer/data').exists() else ROOT/'data'
data=json.loads((ASSET/'etc-matches.json').read_text())
class P:
    def __init__(self,d): self.d={m:F(q) for m,q in (d.items() if isinstance(d,dict) else [((0,0,0),d)]) if q}
    @staticmethod
    def wrap(x): return x if isinstance(x,P) else P(x)
    def __add__(self,b):
        d=self.d.copy()
        for m,q in P.wrap(b).d.items(): d[m]=d.get(m,F(0))+q
        return P(d)
    __radd__=__add__
    def __neg__(self): return P({m:-q for m,q in self.d.items()})
    def __sub__(self,b): return self+-P.wrap(b)
    def __rsub__(self,b): return P.wrap(b)+-self
    def __mul__(self,b):
        d=defaultdict(F)
        for m,q in self.d.items():
            for n,r in P.wrap(b).d.items(): d[tuple(x+y for x,y in zip(m,n))]+=q*r
        return P(d)
    __rmul__=__mul__
    def __pow__(self,n):
        assert isinstance(n,int) and n>=0
        p=P(1);a=self
        while n:
            if n%2: p=p*a
            a=a*a;n//=2
        return p
    def diff(self,k): return P({tuple(x-int(i==k) for i,x in enumerate(m)):q*m[k] for m,q in self.d.items() if m[k]})
    def permute(self,k): return P({tuple(m[i] for i in k):q for m,q in self.d.items()})
    def substitute(self,values):
        powers=[[z**k for k in range(max((m[i] for m in self.d),default=0)+1)] for i,z in enumerate(values)]
        p=P(0)
        for m,q in self.d.items(): p+=q*powers[0][m[0]]*powers[1][m[1]]*powers[2][m[2]]
        return p

a,b,c=[P({tuple(int(j==i) for j in range(3)):1}) for i in range(3)]
def ast(t):
    if t[0]=='num':return P(t[1])
    if t[0]=='var':return {'a':a,'b':b,'c':c}[t[1]]
    if t[0]=='neg':return -ast(t[1])
    if t[0]=='pow':assert t[2][0]=='num';return ast(t[1])**t[2][1]
    A,B=ast(t[1]),ast(t[2])
    if t[0]=='add':return A+B
    if t[0]=='sub':return A-B
    if t[0]=='mul':return A*B
    if t[0]=='div':assert set(B.d)=={(0,0,0)};return A*(1/B.d[(0,0,0)])
    raise ValueError(t)
def prove(id):
    f=ast(data['formulas'][str(id)]['tree']);W=[f,f.permute([2,0,1]),f.permute([1,2,0])];T=sum(W);C=W[2]
    z=b*b+c*c-a*a;t=b*b-c*c-a*a;Y=4*b*b*c*c-z*z
    U=[c*(W[1].diff(k)*T-W[1]*T.diff(k)) for k in [0,1]]
    L=[C.diff(k)*T-C*T.diff(k) for k in [0,1]]
    A=4*a*b*c*c*T*C+2*b*c*U[0]*t+2*a*c*U[1]*z+b*z*L[0]*t+a*z*z*L[1]
    D=4*a*b*c*c*T*C+Y*(b*L[0]+a*L[1])
    B=2*b*c*c*U[0]+2*a*c*c*U[1]+b*c*(z+t)*L[0]+2*a*c*z*L[1]
    det=4*c*c*A*D-Y*B*B
    r={'X':id,'method':'Exact positive coefficients after a=v+w,b=w+u,c=u+v; Jxx,Jyy and determinant cleared by positive denominators.','tests':{}}
    for name,p in [('Jxx',A),('Jyy',D),('determinant',det),('weight_sum_squared',T*T)]:
        p=p.substitute([b+c,c+a,a+b]);coeff=list(p.d.values());ok=bool(coeff) and min(coeff)>=0
        r['tests'][name]={'passed':ok,'degree':max(map(sum,p.d)),'terms':len(coeff),'negative_terms':sum(q<0 for q in coeff),'minimum_coefficient':str(min(coeff)), 'coefficients':[{'powers':list(m),'coefficient':str(q)} for m,q in sorted(p.d.items())] if ok else []}
        print(id,name,ok,len(coeff),'negative',sum(q<0 for q in coeff),flush=True)
    # One strictly positive diagonal plus a nonnegative determinant is enough.
    # A polynomial with nonnegative coefficients and any nonzero coefficient
    # is strictly positive when u,v,w>0. The other diagonal may have mixed
    # coefficients but its sign follows from the determinant identity.
    r['passed']=(r['tests']['Jyy']['passed'] or r['tests']['Jxx']['passed']) and r['tests']['determinant']['passed'] and r['tests']['weight_sum_squared']['passed']
    r['proper_path_certificate']=r['passed']
    total_squared=(T*T).substitute([b+c,c+a,a+b])
    r['nonzero_on_distinct_collinear_triangles']=all(any(m[k]==0 for m in total_squared.d) for k in range(3)) and r['tests']['weight_sum_squared']['passed']
    r['finite_proper_endpoint_certificate']=r['passed'] and r['nonzero_on_distinct_collinear_triangles']
    out=ROOT/'output/etc_matching';out.mkdir(parents=True,exist_ok=True)
    (out/f'positive-X{id}.json').write_text(json.dumps(r,indent=2)+'\n')
    if '--replay' in sys.argv:
        accepted=json.loads((ASSET/'etc-positive-certificates.json').read_text())
        record=next(q for q in accepted['records'] if q['X']==id)
        assert r==record, f'positive coefficient record differs: X({id})'
        assert r['finite_proper_endpoint_certificate']
        print('PASS: positive coefficient replay X('+str(id)+')',flush=True)
if __name__=='__main__':
    for id in map(int,[q for q in sys.argv[1:] if q!='--replay'] or [18236,56203]):prove(id)
