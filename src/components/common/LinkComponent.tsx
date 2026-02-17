import Link, { type LinkProps } from "next/link"
import * as React from "react"

type LinkComponentProps = Omit<React.ComponentPropsWithoutRef<typeof Link>, "href"> & {
  to: LinkProps["href"]
}

const LinkComponent = React.forwardRef<HTMLAnchorElement, LinkComponentProps>(
  ({ to, ...props }, ref) => {
    return <Link ref={ref} href={to} {...props} />
  }
)

LinkComponent.displayName = "LinkComponent"

export default LinkComponent