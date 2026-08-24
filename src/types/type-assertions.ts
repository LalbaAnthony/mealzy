export type IsExactly<TLeft, TRight> =
  (<TProbe>() => TProbe extends TLeft ? 1 : 2) extends <TProbe>() => TProbe extends TRight ? 1 : 2
    ? true
    : false;
