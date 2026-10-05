"""Exact rational interval replay of finite ETC counterexamples.

Research by Ismail Hammoudeh, developed with extensive use of ChatGPT.
The only approximated operations are square roots: integer square root
encloses them on a rational decimal grid. All subsequent endpoints are
Fractions, so the final negative upper bound is a certificate, not a float.
"""
from fractions import Fraction as F
from math import isqrt
from pathlib import Path
import json, csv, hashlib, sys

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/etc_matching'
ASSET = ROOT / 'explorer/data' if (ROOT/'explorer/data').exists() else ROOT/'data'
DIGITS = 45

class I:
    def __init__(self, lo, hi=None):
        self.lo = F(lo); self.hi = F(lo if hi is None else hi)
        assert self.lo <= self.hi
    @staticmethod
    def wrap(x): return x if isinstance(x, I) else I(x)
    def __add__(self, b):
        b = I.wrap(b); return I(self.lo+b.lo, self.hi+b.hi)
    __radd__ = __add__
    def __neg__(self): return I(-self.hi, -self.lo)
    def __sub__(self, b): return self + -I.wrap(b)
    def __rsub__(self, b): return I.wrap(b) + -self
    def __mul__(self, b):
        b = I.wrap(b); xs = [x*y for x in (self.lo,self.hi) for y in (b.lo,b.hi)]
        return I(min(xs),max(xs))
    __rmul__ = __mul__
    def __truediv__(self, b):
        b = I.wrap(b)
        if b.lo <= 0 <= b.hi: raise ArithmeticError('division through zero')
        return self * I(1/b.hi,1/b.lo)
    def __rtruediv__(self, b): return I.wrap(b) / self
    def __pow__(self, n):
        n = F(n)
        if n.denominator == 2: return self.sqrt() ** n.numerator
        if n.denominator != 1: raise ArithmeticError('unsupported rational power')
        n = n.numerator
        if n < 0: return I(1) / self ** -n
        if n == 0: return I(1)
        xs = [self.lo**n,self.hi**n]
        return I(0 if n%2==0 and self.lo<=0<=self.hi else min(xs),max(xs))
    def sqrt(self):
        assert self.lo >= 0
        def endpoint(x, upper):
            u,v=isqrt(x.numerator),isqrt(x.denominator)
            if u*u==x.numerator and v*v==x.denominator: return F(u,v)
            scale=10**DIGITS
            k=isqrt(x.numerator*scale*scale//x.denominator)
            return F(k+int(upper),scale)
        return I(endpoint(self.lo,False),endpoint(self.hi,True))
    def record(self): return [str(self.lo),str(self.hi)]

def expression(t,e):
    op=t[0]
    if op=='num': return I(str(t[1]))
    if op=='var': return e[t[1]]
    if op=='neg': return -expression(t[1],e)
    a,b=expression(t[1],e),expression(t[2],e)
    if op=='add': return a+b
    if op=='sub': return a-b
    if op=='mul': return a*b
    if op=='div': return a/b
    if op=='pow':
        assert b.lo==b.hi
        return a**b.lo
    raise ValueError(op)

def center(tree,vertices):
    v=[[F(str(x)) for x in q] for q in vertices]
    e=[v[1][k]-v[0][k] for k in range(2)]
    f=[v[2][k]-v[0][k] for k in range(2)]
    area=I(abs(e[0]*f[1]-e[1]*f[0])/2)
    assert area.lo>0, 'both configurations must be proper'
    sides=[I(sum((v[(i+1)%3][k]-v[(i+2)%3][k])**2 for k in range(2))).sqrt() for i in range(3)]
    s=sum(sides)/2; weights=[]
    for i,a in enumerate(sides):
        b,c=sides[(i+1)%3],sides[(i+2)%3]
        env=dict(a=a,b=b,c=c,s=s,sp=s,sa=s-a,sb=s-b,sc=s-c,S=2*area,Delta=area,R=a*b*c/(4*area),r=area/s,
                 SA=(b*b+c*c-a*a)/2,SB=(c*c+a*a-b*b)/2,SC=(a*a+b*b-c*c)/2,SW=(a*a+b*b+c*c)/2)
        weights.append(expression(tree,env))
    total=sum(weights)
    result=[sum(weights[i]*v[i][k] for i in range(3))/total for k in range(2)]
    return result,total

def certify(tree,vertices,vertex,h):
    v=[[F(str(x)) for x in q] for q in vertices];h=[F(str(x)) for x in h]
    after=[q.copy() for q in v]
    after[vertex]=[x+d for x,d in zip(v[vertex],h)]
    p,t=center(tree,v);q,u=center(tree,after)
    dot=sum(h[k]*(q[k]-p[k]) for k in range(2))
    assert dot.hi<0, 'not a certified failure'
    return dict(vertices=[[str(x) for x in a] for a in v],vertex=vertex,h=[str(x) for x in h],
                dot=dot.record(),normalized_dot=(dot/sum(x*x for x in h)).record(),
                weight_total_before=t.record(),weight_total_after=u.record())

def main():
    data=json.loads((ASSET/'etc-matches.json').read_text(encoding='utf-8'))
    if '--replay' in sys.argv:
        records=json.loads((ASSET/'etc-attractivity-certificates.json').read_text())
        assert records['formula_sha256']==hashlib.sha256(json.dumps(data['formulas'],sort_keys=True,separators=(',',':')).encode()).hexdigest()
        for key,r in records['records'].items():
            replay=certify(data['formulas'][key]['tree'],r['vertices'],r['vertex'],r['h'])
            assert replay==r, f'certificate record differs: X({key})'
        print('PASS: exact independent replay of',len(records['records']),'finite ETC failure records.')
        return
    screen=json.loads((OUT/'attractivity-screen.json').read_text())
    records={};compact={}
    for key,r in screen['records'].items():
        proof=None
        if r['finiteWitness']:
            w=r['finiteWitness']
            # A large-enough step avoids subtractive cancellation in the enclosure.
            candidates=[(w['vertices'],w['vertex'],c['h']) for c in w['checks'] if c['dot']<0]
            if key=='7934': candidates.insert(0,([[0,0],[1,0],['1/2','5/8']],2,['1/1000',0]))
            for v,i,h in candidates:
                try: proof=certify(data['formulas'][key]['tree'],v,i,h);break
                except (AssertionError,ArithmeticError): continue
            assert proof is not None, f'failed replay X({key})'
            records[key]=proof
        status='certified failure' if proof else r['status']
        positive_path=OUT/f'positive-X{key}.json'
        if positive_path.exists():
            positive=json.loads(positive_path.read_text())
            if positive.get('finite_proper_endpoint_certificate'): status='proved attractive'
        entry=dict(status=status,minimum_eigenvalue=r['minimumEigenvalue'],valid=r['valid'],undefined=r['undefinedCount'])
        if proof:
            entry['witness']=dict(vertices=[[float(F(x)) for x in a] for a in proof['vertices']],vertex=proof['vertex'],h=[float(F(x)) for x in proof['h']],
                                  normalized_dot_upper=float(F(proof['normalized_dot'][1])),certificate=f'data/etc-attractivity-certificates.json#X{key}')
        compact[key]=entry
        print(f'X({key}): {status}',flush=True)
    selected={str(row['X']) for p in data['powers'] for family in ['atomic','hull'] for row in p[family]}
    counts={status:sum(compact[k]['status']==status for k in selected) for status in sorted({r['status'] for r in compact.values()})}
    certificate=dict(author=data['author'],acknowledgement=data['acknowledgement'],method='Exact Fraction interval arithmetic; positive square roots enclosed with integer square root at 45 decimal places; both proper endpoint configurations and nonzero homogeneous weight sums verified.',
                     formula_sha256=hashlib.sha256(json.dumps(data['formulas'],sort_keys=True,separators=(',',':')).encode()).hexdigest(),records=records)
    (OUT/'attractivity-certificates.json').write_text(json.dumps(certificate,indent=2)+'\n')
    (ASSET/'etc-attractivity-certificates.json').write_text(json.dumps(certificate,separators=(',',':'))+'\n')
    positives=[json.loads(path.read_text()) for path in sorted(OUT.glob('positive-X*.json'))]
    positives=[p for p in positives if p.get('finite_proper_endpoint_certificate')]
    (ASSET/'etc-positive-certificates.json').write_text(json.dumps(dict(author=data['author'],acknowledgement=data['acknowledgement'],scope='Every finite single-vertex motion with proper triangle endpoints. Distinct collinear crossings follow by continuity; coincidence-crossing paths by endpoint approximation. No value at an exactly coincident input is asserted.',records=positives),separators=(',',':'))+'\n')
    data['attractivity']=dict(shape_count=screen['shapeCount'],selected_count=len(selected),selected_status_counts=counts,
        method=screen['method'],records=compact,positive_warning='No sampled failure does not prove universal attractivity. ETC rules are independent of p; status belongs to the rule, not to its matching power.')
    (ASSET/'etc-matches.json').write_text(json.dumps(data,separators=(',',':'),allow_nan=False)+'\n',encoding='utf-8')
    with (ASSET/'etc-attractivity.csv').open('w',newline='',encoding='utf-8') as f:
        w=csv.writer(f);w.writerow(['ETC','selected_neighbor','status','sampled_minimum_symmetric_eigenvalue','valid_triangles','certified_finite_normalized_dot_upper'])
        for k,r in compact.items(): w.writerow([f'X({k})',k in selected,r['status'],r['minimum_eigenvalue'],r['valid'],r.get('witness',{}).get('normalized_dot_upper','')])
    print('Selected neighbors:',len(selected),'status counts:',counts,'exact failures:',len(records))

if __name__=='__main__': main()
