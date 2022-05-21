const func = (params: [number]) => {
    let tmp = 0;
    params.forEach((p) => {
      tmp += p;
    });
    return tmp;
  };