import * as uuid from 'uuid';

interface SipInactiveInstanceData {
  id: string;
  endpointId: string;
  inactiveAt: number;
}

export class SipInstanceManager {
  protected _prefix: string;

  constructor(prefix: string) {
    this._prefix = prefix;
  }

  getInstanceId(endpointId: string): string {
    const allInstances = this._getAllInActiveInstancesData();
    const currentTime = Date.now();
    // clean expired data;
    allInstances.forEach((instance) => {
      if (
        instance.endpointId !== endpointId ||
        currentTime - instance.inactiveAt >= 180000
      ) {
        // clean instance not in current endpoint id
        // clean instance if inactive before 3 min
        this._removeInstanceData(instance.id);
      }
    });
    // find inactive instance that inactive in 3 min
    const inactiveInstance = allInstances
      .filter((instance) => {
        return (
          instance.endpointId === endpointId &&
          currentTime - instance.inactiveAt < 180000
        );
      })
      .sort((inst1, inst2) => inst2.inactiveAt - inst1.inactiveAt)[0];
    // reuse inactive instance
    if (inactiveInstance) {
      // remove it from localStorage, so it can only be used in current tab
      this._removeInstanceData(inactiveInstance.id);
      return inactiveInstance.id;
    }
    return uuid.v4();
  }

  setInstanceInactive(instanceId: string, endpointId: string): void {
    const instanceData: SipInactiveInstanceData = {
      id: instanceId,
      endpointId,
      inactiveAt: Date.now(),
    };
    this._saveInstanceData(instanceData);
  }

  _getAllInActiveInstancesData() {
    const keys = this._getAllKeys();
    const instances: SipInactiveInstanceData[] = [];
    keys.forEach((key) => {
      const rawData = localStorage.getItem(key);
      if (rawData) {
        instances.push(JSON.parse(rawData) as SipInactiveInstanceData);
      }
    });
    return instances;
  }

  _saveInstanceData(instanceData: SipInactiveInstanceData) {
    localStorage.setItem(
      `${this._prefix}-${instanceData.id}`,
      JSON.stringify(instanceData),
    );
  }

  _removeInstanceData(instanceId: string) {
    localStorage.removeItem(`${this._prefix}-${instanceId}`);
  }

  _getAllKeys(): string[] {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key !== '' && key.indexOf(this._prefix) === 0) {
        keys.push(key);
      }
    }
    return keys;
  }
}
