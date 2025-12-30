import preview from '#.storybook/preview';
import { DotsThree } from '@phosphor-icons/react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';
import { Button } from './button';

const meta = preview.meta({
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm'],
    },
  },
});

export const Default = meta.story({
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here with additional context.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content can contain any elements you need.</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">
          Cancel
        </Button>
        <Button size="sm" className="ml-auto">
          Save
        </Button>
      </CardFooter>
    </Card>
  ),
});

export const WithAction = meta.story({
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card with Action</CardTitle>
        <CardDescription>This card has an action button in the header.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm">
            <DotsThree weight="bold" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>The action slot allows for header actions like menus or buttons.</p>
      </CardContent>
    </Card>
  ),
});

export const SmallSize = meta.story({
  render: () => (
    <Card size="sm" className="w-64">
      <CardHeader>
        <CardTitle>Small Card</CardTitle>
        <CardDescription>Compact card variant.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Smaller padding and spacing.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
});

export const AllSizes = meta.story({
  render: () => (
    <div className="flex gap-4">
      <Card className="w-64">
        <CardHeader>
          <CardTitle>Default Size</CardTitle>
          <CardDescription>Standard card sizing.</CardDescription>
        </CardHeader>
        <CardContent>Default content area.</CardContent>
      </Card>
      <Card size="sm" className="w-64">
        <CardHeader>
          <CardTitle>Small Size</CardTitle>
          <CardDescription>Compact card sizing.</CardDescription>
        </CardHeader>
        <CardContent>Small content area.</CardContent>
      </Card>
    </div>
  ),
});
