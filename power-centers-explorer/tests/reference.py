"""Generate small cross-implementation fixtures from the research solvers.
Run from the research workspace; Python/NumPy are only needed to regenerate.
"""
from pathlib import Path
import sys, json
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'research'))
from hull_power import hull_power
from simplex_volume import volume_power
triangle=[[-1,0],[1,0],[.58,.92]]
tetrahedron=[[-1,0,0],[1,0,0],[-.3,.9,.75],[.25,.5,-.8]]
result=[]
for p in [4-2*np.sqrt(2),1.5,4,8,16,21.63]:
    value=hull_power(triangle,p,order=48,graded=True)
    result.append(dict(vertices=triangle,p=p,center=value['center'].tolist(),tolerance=3e-9,source='research/hull_power.py, order 48, graded edges'))
for p in [4,8,16,19.95]:
    value=volume_power(tetrahedron,p,order=30)
    result.append(dict(vertices=tetrahedron,p=p,center=value['center'].tolist(),tolerance=3e-8,source='research/simplex_volume.py, independent volume order 30'))
Path(__file__).with_name('reference.json').write_text(json.dumps(result,indent=2)+'\n')
print('Wrote',len(result),'independent reference cases')
